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
