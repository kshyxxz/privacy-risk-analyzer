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

		process.exit(0);
	} catch (error) {
		console.error("❌ Database initialization error:", error.message);
		process.exit(1);
	}
}

initializeDatabase();
