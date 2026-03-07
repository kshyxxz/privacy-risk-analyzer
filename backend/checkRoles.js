const pool = require("./config/db");

async function checkRoles() {
	try {
		console.log("Checking roles table...\n");

		const result = await pool.query("SELECT * FROM roles");

		if (result.rows.length === 0) {
			console.log("❌ No roles found in database");
			console.log("\nInserting default roles...");

			const insertRoles = await pool.query(`
				INSERT INTO roles (role_name, description) VALUES 
				('Admin', 'Administrator with full access'),
				('Analyst', 'Analyst with risk analysis access'),
				('Intern', 'Intern with read-only access')
				RETURNING *
			`);

			console.log("✅ Roles inserted:");
			insertRoles.rows.forEach((role) => {
				console.log(
					`   ID: ${role.id || role.role_id}, Name: ${role.role_name}`,
				);
			});
		} else {
			console.log("✅ Existing roles:");
			result.rows.forEach((role) => {
				const roleId = role.id || role.role_id;
				console.log(`   ID: ${roleId}, Name: ${role.role_name}`);
			});
		}

		process.exit(0);
	} catch (error) {
		console.error("❌ Error:", error.message);
		process.exit(1);
	}
}

checkRoles();
