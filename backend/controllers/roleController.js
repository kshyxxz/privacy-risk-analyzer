const pool = require("../config/db");

exports.getAllRoles = async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT role_id, role_name, description FROM roles ORDER BY role_id",
		);
		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching roles:", error);
		res.status(500).json({ error: "Failed to fetch roles" });
	}
};
