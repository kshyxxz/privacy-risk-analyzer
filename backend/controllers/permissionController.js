const pool = require("../config/db");
const { logAuditEvent } = require("../services/auditLogService");

exports.getAllPermissions = async (req, res) => {
	try {
		const result = await pool.query(`
    SELECT ap.permission_id,
           r.role_name,
           d.asset_name,
           ap.access_type
    FROM access_permissions ap
    JOIN roles r ON ap.role_id = r.role_id
    JOIN data_assets d ON ap.asset_id = d.asset_id
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

		const normalizedAccessType = String(access_type).toUpperCase();
		if (!["READ", "WRITE", "UPDATE"].includes(normalizedAccessType)) {
			return res.status(400).json({
				error: "access_type must be one of READ, WRITE, UPDATE",
			});
		}

		const existing = await pool.query(
			"SELECT permission_id FROM access_permissions WHERE role_id = $1 AND asset_id = $2",
			[role_id, asset_id],
		);

		if (existing.rows.length > 0) {
			const updateResult = await pool.query(
				`UPDATE access_permissions
				 SET access_type = $1
				 WHERE permission_id = $2
				 RETURNING *`,
				[normalizedAccessType, existing.rows[0].permission_id],
			);

			await logAuditEvent({
				userId: req.user?.user_id,
				assetId: Number(asset_id),
				action: "UPDATE",
			});

			return res.status(200).json({
				message: "Permission updated for this role and asset",
				permission: updateResult.rows[0],
			});
		}

		const result = await pool.query(
			`INSERT INTO access_permissions (role_id, asset_id, access_type)
     VALUES ($1,$2,$3) RETURNING *`,
			[role_id, asset_id, normalizedAccessType],
		);

		await logAuditEvent({
			userId: req.user?.user_id,
			assetId: Number(asset_id),
			action: "WRITE",
		});

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
			`UPDATE access_permissions
     SET role_id=$1, asset_id=$2, access_type=$3
     WHERE permission_id=$4`,
			[role_id, asset_id, access_type, id],
		);

		await logAuditEvent({
			userId: req.user?.user_id,
			assetId: Number(asset_id),
			action: "UPDATE",
		});

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

		const deleted = await pool.query(
			"DELETE FROM access_permissions WHERE permission_id=$1 RETURNING asset_id",
			[id],
		);

		if (deleted.rows.length === 0) {
			return res.status(404).json({ error: "Permission not found" });
		}

		await logAuditEvent({
			userId: req.user?.user_id,
			assetId: deleted.rows[0].asset_id || null,
			action: "DELETE",
		});

		res.status(200).json({ message: "Permission deleted successfully" });
	} catch (error) {
		console.error("Error deleting permission:", error);
		res.status(500).json({ error: "Failed to delete permission" });
	}
};
