const pool = require("./config/db");

async function cleanupUsers() {
	try {
		console.log("🧹 Cleaning up old test users...\n");

		// Delete all non-default users
		const result = await pool.query(
			"DELETE FROM users WHERE username != 'admin' RETURNING username",
		);

		console.log(`✅ Deleted ${result.rows.length} old test user(s):`);
		result.rows.forEach((row) => {
			console.log(`   - ${row.username}`);
		});

		console.log("\n📋 Remaining users:");
		const remaining = await pool.query(
			"SELECT user_id, username, email FROM users",
		);
		remaining.rows.forEach((user) => {
			console.log(`   - ${user.username} (${user.email})`);
		});

		process.exit(0);
	} catch (error) {
		console.error("❌ Error:", error.message);
		process.exit(1);
	}
}

cleanupUsers();
