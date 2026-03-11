const pool = require("./config/db");
const fs = require("fs");
const path = require("path");

async function initializeDatabase() {
	try {
		console.log("Checking database tables...");

		// First, check if users table exists
		const checkTable = await pool.query(`
			SELECT table_name FROM information_schema.tables 
			WHERE table_schema = 'public' AND table_name = 'users'
		`);

		if (checkTable.rows.length === 0) {
			console.log("❌ Users table not found. Applying schema...");

			// Read and execute schema
			const schemaPath = path.join(__dirname, "schema.sql");
			const schema = fs.readFileSync(schemaPath, "utf8");

			// Split by semicolon and execute each statement
			const statements = schema
				.split(";")
				.filter((stmt) => stmt.trim().length > 0);

			for (const statement of statements) {
				try {
					await pool.query(statement);
				} catch (err) {
					console.warn(
						"⚠️ Statement warning:",
						err.message.substring(0, 100),
					);
				}
			}

			console.log("✅ Database schema applied successfully!");
		} else {
			console.log("✅ Users table already exists");
		}

		// Check all tables
		const tables = await pool.query(`
			SELECT table_name FROM information_schema.tables 
			WHERE table_schema = 'public' 
			ORDER BY table_name
		`);

		console.log("\n📋 Existing tables:");
		tables.rows.forEach((row) => {
			console.log(`   - ${row.table_name}`);
		});

		// Ensure baseline roles exist for auth and access control.
		await pool.query(
			`INSERT INTO roles (role_name, description) VALUES
			 ('Admin', 'Full access'),
			 ('Analyst', 'Standard analyst access'),
			 ('Intern', 'Limited access')
			 ON CONFLICT (role_name) DO NOTHING`,
		);

		console.log("✅ Default roles verified (Admin, Analyst, Intern)");

		// Ensure security_controls has updated_at for UI "Last Updated".
		await pool.query(
			"ALTER TABLE security_controls ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
		);
		await pool.query(
			"UPDATE security_controls SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL",
		);
		console.log("✅ security_controls.updated_at verified");

		// Ensure access_permissions supports the allowed model (READ/WRITE/UPDATE/DELETE).
		await pool.query(
			"UPDATE access_permissions SET access_type = 'DELETE' WHERE access_type = 'ADMIN'",
		);
		await pool.query(`
			DO $$
			DECLARE
				check_name text;
			BEGIN
				SELECT c.conname
				INTO check_name
				FROM pg_constraint c
				JOIN pg_class t ON t.oid = c.conrelid
				JOIN pg_namespace n ON n.oid = t.relnamespace
				WHERE n.nspname = 'public'
				  AND t.relname = 'access_permissions'
				  AND c.contype = 'c'
				  AND pg_get_constraintdef(c.oid) ILIKE '%access_type%';

				IF check_name IS NOT NULL THEN
					EXECUTE format('ALTER TABLE public.access_permissions DROP CONSTRAINT %I', check_name);
				END IF;
			END $$;
		`);
		await pool.query(`
			ALTER TABLE public.access_permissions
			ADD CONSTRAINT access_permissions_access_type_check
			CHECK (access_type IN ('READ','WRITE','UPDATE','DELETE'))
		`);

		// Drop any old unique constraint that only covered (role_id, asset_id) without
		// access_type — this previously blocked adding a second access type per role/asset.
		await pool.query(`
			DO $$
			DECLARE
				con_rec RECORD;
			BEGIN
				FOR con_rec IN
					SELECT c.conname
					FROM pg_constraint c
					JOIN pg_class t ON t.oid = c.conrelid
					JOIN pg_namespace n ON n.oid = t.relnamespace
					WHERE n.nspname = 'public'
					  AND t.relname = 'access_permissions'
					  AND c.contype = 'u'
					  AND c.conname <> 'uk_permission_role_asset_access'
				LOOP
					EXECUTE format('ALTER TABLE public.access_permissions DROP CONSTRAINT %I', con_rec.conname);
				END LOOP;
			END $$;
		`);

		// Allow multiple access types per role/asset while preventing exact duplicates.
		await pool.query(`
			DELETE FROM access_permissions ap
			USING access_permissions dup
			WHERE ap.permission_id > dup.permission_id
			  AND ap.role_id = dup.role_id
			  AND ap.asset_id = dup.asset_id
			  AND ap.access_type = dup.access_type
		`);
		await pool.query(
			"ALTER TABLE public.access_permissions DROP CONSTRAINT IF EXISTS uk_permission_role_asset_access",
		);
		await pool.query(`
			ALTER TABLE public.access_permissions
			ADD CONSTRAINT uk_permission_role_asset_access
			UNIQUE (role_id, asset_id, access_type)
		`);

		// Ensure risk_assessment supports the dynamic six-level taxonomy.
		await pool.query(`
			DO $$
			DECLARE
				check_name text;
			BEGIN
				SELECT c.conname
				INTO check_name
				FROM pg_constraint c
				JOIN pg_class t ON t.oid = c.conrelid
				JOIN pg_namespace n ON n.oid = t.relnamespace
				WHERE n.nspname = 'public'
				  AND t.relname = 'risk_assessment'
				  AND c.contype = 'c'
				  AND pg_get_constraintdef(c.oid) ILIKE '%risk_level%';

				IF check_name IS NOT NULL THEN
					EXECUTE format('ALTER TABLE public.risk_assessment DROP CONSTRAINT %I', check_name);
				END IF;
			END $$;
		`);
		await pool.query(`
			ALTER TABLE public.risk_assessment
			ADD CONSTRAINT risk_assessment_risk_level_check
			CHECK (risk_level IN ('MINIMAL','LOW','MODERATE','HIGH','CRITICAL','EXTREME'))
		`);
		console.log("✅ risk and permission constraints verified");

		console.log("✅ Database initialization complete!\n");
		return true;
	} catch (error) {
		console.error("❌ Database initialization error:", error.message);
		throw error;
	}
}

// Export for use as a module
module.exports = initializeDatabase;

// If run directly as a script, initialize and exit
if (require.main === module) {
	initializeDatabase()
		.then(() => process.exit(0))
		.catch(() => process.exit(1));
}
