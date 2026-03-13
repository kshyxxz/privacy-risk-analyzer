const pool = require("../../config/db");
const { logAuditEvent } = require("../../services/auditLogService");

const ROLE_ALLOWED_ACCESS_TYPES = {
	ADMIN: ["READ", "WRITE", "UPDATE", "DELETE"],
	ANALYST: ["READ", "UPDATE"],
	INTERN: ["READ"],
};

const getAllowedAccessTypesForRole = (roleName) => {
	const normalizedRole = String(roleName || "")
		.trim()
		.toUpperCase();
	return ROLE_ALLOWED_ACCESS_TYPES[normalizedRole] || ["READ"];
};

exports.getAllPermissions = async (req, res) => {
	try {
		const result = await pool.query(`
    SELECT ap.permission_id,
           ap.role_id,
           ap.asset_id,
           r.role_name,
           d.asset_name,
           ap.access_type
    FROM access_permissions ap
    JOIN roles r ON ap.role_id = r.role_id
    JOIN data_assets d ON ap.asset_id = d.asset_id
		WHERE UPPER(r.role_name) <> 'ADMIN'
    ORDER BY r.role_name, d.asset_name, ap.access_type
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

		const roleResult = await pool.query(
			"SELECT role_name FROM roles WHERE role_id = $1",
			[role_id],
		);

		if (roleResult.rows.length === 0) {
			return res.status(404).json({ error: "Role not found" });
		}

		if (
			String(roleResult.rows[0].role_name || "").toUpperCase() === "ADMIN"
		) {
			return res.status(400).json({
				error: "Admin has default full access and should not be managed in Permissions",
			});
		}

		const normalizedAccessType = String(access_type).toUpperCase();
		if (
			!["READ", "WRITE", "UPDATE", "DELETE"].includes(
				normalizedAccessType,
			)
		) {
			return res.status(400).json({
				error: "access_type must be one of READ, WRITE, UPDATE, DELETE",
			});
		}

		const roleName = roleResult.rows[0].role_name;
		const allowedAccessTypes = getAllowedAccessTypesForRole(roleName);
		if (!allowedAccessTypes.includes(normalizedAccessType)) {
			return res.status(400).json({
				error: `${roleName} role can only be assigned these access types: ${allowedAccessTypes.join(", ")}`,
			});
		}

		const existing = await pool.query(
			`SELECT permission_id, role_id, asset_id, access_type
			 FROM access_permissions
			 WHERE role_id = $1 AND asset_id = $2 AND access_type = $3`,
			[role_id, asset_id, normalizedAccessType],
		);

		if (existing.rows.length > 0) {
			return res.status(200).json({
				message:
					"Permission already exists for this role, asset, and access type",
				permission: existing.rows[0],
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
		if (error.code === "23505") {
			return res.status(409).json({
				error: "Permission already exists for this role, asset, and access type",
			});
		}
		if (error.code === "23514" || error.code === "22P02") {
			return res.status(400).json({
				error: "Invalid access_type. Allowed values: READ, WRITE, UPDATE, DELETE",
			});
		}
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

		const roleResult = await pool.query(
			"SELECT role_name FROM roles WHERE role_id = $1",
			[role_id],
		);

		if (roleResult.rows.length === 0) {
			return res.status(404).json({ error: "Role not found" });
		}

		if (
			String(roleResult.rows[0].role_name || "").toUpperCase() === "ADMIN"
		) {
			return res.status(400).json({
				error: "Admin has default full access and should not be managed in Permissions",
			});
		}

		const normalizedAccessType = String(access_type).toUpperCase();
		if (
			!["READ", "WRITE", "UPDATE", "DELETE"].includes(
				normalizedAccessType,
			)
		) {
			return res.status(400).json({
				error: "access_type must be one of READ, WRITE, UPDATE, DELETE",
			});
		}

		const roleName = roleResult.rows[0].role_name;
		const allowedAccessTypes = getAllowedAccessTypesForRole(roleName);
		if (!allowedAccessTypes.includes(normalizedAccessType)) {
			return res.status(400).json({
				error: `${roleName} role can only be assigned these access types: ${allowedAccessTypes.join(", ")}`,
			});
		}

		const duplicate = await pool.query(
			`SELECT permission_id
			 FROM access_permissions
			 WHERE role_id = $1 AND asset_id = $2 AND access_type = $3 AND permission_id <> $4`,
			[role_id, asset_id, normalizedAccessType, id],
		);

		if (duplicate.rows.length > 0) {
			return res.status(409).json({
				error: "Permission already exists for this role, asset, and access type",
			});
		}

		await pool.query(
			`UPDATE access_permissions
     SET role_id=$1, asset_id=$2, access_type=$3
     WHERE permission_id=$4`,
			[role_id, asset_id, normalizedAccessType, id],
		);

		await logAuditEvent({
			userId: req.user?.user_id,
			assetId: Number(asset_id),
			action: "UPDATE",
		});

		res.status(200).json({ message: "Permission updated successfully" });
	} catch (error) {
		console.error("Error updating permission:", error);
		if (error.code === "23505") {
			return res.status(409).json({
				error: "Permission already exists for this role, asset, and access type",
			});
		}
		if (error.code === "23514" || error.code === "22P02") {
			return res.status(400).json({
				error: "Invalid access_type. Allowed values: READ, WRITE, UPDATE, DELETE",
			});
		}
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
