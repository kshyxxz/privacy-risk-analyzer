const pool = require("../config/db");

exports.getAllPermissions = async (req, res) => {
	try {
		const result = await pool.query(`
    SELECT ap.permission_id,
           r.role_name,
           d.asset_name,
           ap.access_type
    FROM access_permission ap
    JOIN role r ON ap.role_id = r.role_id
    JOIN data_asset d ON ap.asset_id = d.asset_id
    ORDER BY ap.permission_id
  `);

		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching permissions:", error);
		res.status(500).json({ error: "Failed to fetch permissions" });
	}
};

exports.createPermission = async (req, res) => {
	try {
		const { role_id, asset_id, access_type } = req.body;

		if (!role_id || !asset_id || !access_type) {
			return res.status(400).json({
				error: "Missing required fields: role_id, asset_id, access_type",
			});
		}

		const result = await pool.query(
			`INSERT INTO access_permission (role_id, asset_id, access_type)
     VALUES ($1,$2,$3) RETURNING *`,
			[role_id, asset_id, access_type],
		);

		res.status(201).json(result.rows[0]);
	} catch (error) {
		console.error("Error creating permission:", error);
		res.status(500).json({ error: "Failed to create permission" });
	}
};

exports.updatePermission = async (req, res) => {
	try {
		const { id } = req.params;
		const { role_id, asset_id, access_type } = req.body;

		if (!id || !role_id || !asset_id || !access_type) {
			return res.status(400).json({
				error: "Missing required fields: id, role_id, asset_id, access_type",
			});
		}

		await pool.query(
			`UPDATE access_permission
     SET role_id=$1, asset_id=$2, access_type=$3
     WHERE permission_id=$4`,
			[role_id, asset_id, access_type, id],
		);

		res.status(200).json({ message: "Permission updated successfully" });
	} catch (error) {
		console.error("Error updating permission:", error);
		res.status(500).json({ error: "Failed to update permission" });
	}
};

exports.deletePermission = async (req, res) => {
	try {
		const { id } = req.params;

		if (!id) {
			return res.status(400).json({ error: "Permission ID is required" });
		}

		await pool.query(
			"DELETE FROM access_permission WHERE permission_id=$1",
			[id],
		);

		res.status(200).json({ message: "Permission deleted successfully" });
	} catch (error) {
		console.error("Error deleting permission:", error);
		res.status(500).json({ error: "Failed to delete permission" });
	}
};
