const pool = require("./config/db");
const fs = require("fs");
const path = require("path");

async function initializeDatabase() {
	try {
		// First, check if users table exists
		const checkTable = await pool.query(`
			SELECT table_name FROM information_schema.tables 
			WHERE table_schema = 'public' AND table_name = 'users'
		`);

		if (checkTable.rows.length === 0) {
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
		}

		// Ensure baseline roles exist for auth and access control.
		await pool.query(
			`INSERT INTO roles (role_name, description) VALUES
			 ('Admin', 'Full access'),
			 ('Analyst', 'Standard analyst access'),
			 ('Intern', 'Limited access')
			 ON CONFLICT (role_name) DO NOTHING`,
		);

		// Ensure security_controls has updated_at for UI "Last Updated".
		await pool.query(
			"ALTER TABLE security_controls ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
		);
		await pool.query(
			"UPDATE security_controls SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL",
		);

		// Ensure access_permissions supports the allowed model (READ/WRITE/UPDATE/DELETE).
		// Some legacy databases used a custom enum for access_type; convert to text first
		// so DELETE can be persisted consistently across environments.
		await pool.query(`
			DO $$
			DECLARE
				current_udt text;
			BEGIN
				SELECT c.udt_name
				INTO current_udt
				FROM information_schema.columns c
				WHERE c.table_schema = 'public'
				  AND c.table_name = 'access_permissions'
				  AND c.column_name = 'access_type';

				IF current_udt IS NOT NULL
				   AND current_udt NOT IN ('varchar', 'text', 'bpchar') THEN
					EXECUTE 'ALTER TABLE public.access_permissions ALTER COLUMN access_type TYPE text USING access_type::text';
				END IF;
			END $$;
		`);
		await pool.query(
			"UPDATE access_permissions SET access_type = UPPER(access_type) WHERE access_type <> UPPER(access_type)",
		);
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

		// Backfill default permissions model for existing rows:
		// - All roles get READ on all assets
		// - Admin also gets WRITE, UPDATE, DELETE on all assets
		await pool.query(`
			INSERT INTO access_permissions (role_id, asset_id, access_type)
			SELECT
				r.role_id,
				da.asset_id,
				access_map.access_type
			FROM roles r
			CROSS JOIN data_assets da
			CROSS JOIN LATERAL (
				SELECT 'READ'::text AS access_type
				UNION ALL SELECT 'WRITE'::text WHERE UPPER(r.role_name) = 'ADMIN'
				UNION ALL SELECT 'UPDATE'::text WHERE UPPER(r.role_name) = 'ADMIN'
				UNION ALL SELECT 'DELETE'::text WHERE UPPER(r.role_name) = 'ADMIN'
			) access_map
			ON CONFLICT (role_id, asset_id, access_type) DO NOTHING
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
