const pool = require("../../config/db");
const { logAuditEvent } = require("../../services/auditLogService");

exports.getAssets = async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT data_assets.*, LOWER(COALESCE(sensitivity_level, '')) AS risk_level FROM data_assets ORDER BY asset_id",
		);
		res.status(200).json(result.rows);
	} catch (error) {
		console.error("   ❌ Error fetching assets:", error.message);
		res.status(500).json({ error: "Failed to fetch assets" });
	}
};

exports.createAsset = async (req, res) => {
	const client = await pool.connect();
	try {
		const {
			asset_name,
			db_name,
			table_name,
			sensitivity_level,
			contains_pii,
			created_by,
		} = req.body;

		// Input validation
		if (!asset_name) {
			return res.status(400).json({
				error: "Missing required field: asset_name",
			});
		}

		// Prefer the authenticated user from JWT; fallback to request body if needed.
		let normalizedCreatedBy =
			req.user?.user_id !== undefined ? Number(req.user.user_id) : null;

		if (
			!normalizedCreatedBy &&
			created_by !== undefined &&
			created_by !== null &&
			created_by !== ""
		) {
			normalizedCreatedBy = Number(created_by);
		}

		if (normalizedCreatedBy !== null) {
			if (
				!Number.isInteger(normalizedCreatedBy) ||
				normalizedCreatedBy < 1
			) {
				return res.status(400).json({
					error: "created_by must be a positive integer",
				});
			}

			const userExists = await pool.query(
				"SELECT user_id FROM users WHERE user_id = $1",
				[normalizedCreatedBy],
			);

			if (userExists.rows.length === 0) {
				console.warn(
					"⚠️ createAsset: created_by not found in users table, saving as NULL:",
					normalizedCreatedBy,
				);
				normalizedCreatedBy = null;
			}
		}

		const normalizedContainsPii = Boolean(contains_pii);

		await client.query("BEGIN");

		const result = await client.query(
			"INSERT INTO data_assets(asset_name, db_name, table_name, sensitivity_level, contains_pii, created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
			[
				asset_name,
				db_name || null,
				table_name || null,
				sensitivity_level || null,
				normalizedContainsPii,
				normalizedCreatedBy,
			],
		);

		const createdAssetId = result.rows[0]?.asset_id;

		if (createdAssetId) {
			await client.query(
				`
				INSERT INTO access_permissions (role_id, asset_id, access_type)
				SELECT
					r.role_id,
					$1::int AS asset_id,
					access_map.access_type
				FROM roles r
				CROSS JOIN LATERAL (
					SELECT 'READ'::text AS access_type
					UNION ALL SELECT 'WRITE'::text WHERE UPPER(r.role_name) = 'ADMIN'
					UNION ALL SELECT 'UPDATE'::text WHERE UPPER(r.role_name) = 'ADMIN'
					UNION ALL SELECT 'DELETE'::text WHERE UPPER(r.role_name) = 'ADMIN'
				) access_map
				ON CONFLICT (role_id, asset_id, access_type) DO NOTHING
				`,
				[createdAssetId],
			);
		}

		await client.query("COMMIT");

		await logAuditEvent({
			userId: req.user?.user_id,
			assetId: createdAssetId || null,
			action: "WRITE",
		});
		res.status(201).json(result.rows[0]);
	} catch (error) {
		try {
			await client.query("ROLLBACK");
		} catch (rollbackError) {
			console.error("❌ Rollback failed:", rollbackError.message);
		}

		console.error("❌ Error creating asset:", error);
		if (error.code === "23503") {
			return res.status(400).json({
				error: "Invalid reference data. Please log in again and retry.",
			});
		}
		res.status(500).json({ error: "Failed to create asset" });
	} finally {
		client.release();
	}
};

exports.deleteAsset = async (req, res) => {
	try {
		const { id } = req.params;

		if (!id) {
			return res.status(400).json({ error: "Asset ID is required" });
		}

		const normalizedId = Number(id);
		if (!Number.isInteger(normalizedId) || normalizedId < 1) {
			return res
				.status(400)
				.json({ error: "Asset ID must be a positive integer" });
		}

		const existing = await pool.query(
			"SELECT asset_id FROM data_assets WHERE asset_id = $1",
			[normalizedId],
		);

		if (existing.rows.length === 0) {
			return res.status(404).json({ error: "Data asset not found" });
		}

		await pool.query("DELETE FROM data_assets WHERE asset_id = $1", [
			normalizedId,
		]);

		await logAuditEvent({
			userId: req.user?.user_id,
			assetId: normalizedId,
			action: "DELETE",
		});

		res.status(200).json({ message: "Data asset deleted successfully" });
	} catch (error) {
		console.error("❌ Error deleting asset:", error);
		res.status(500).json({ error: "Failed to delete asset" });
	}
};
