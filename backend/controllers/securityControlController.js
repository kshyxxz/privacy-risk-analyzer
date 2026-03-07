const pool = require("../config/db");
const { logAuditEvent } = require("../services/auditLogService");

exports.getSecurityControls = async (req, res) => {
	try {
		const result = await pool.query(
			`SELECT sc.control_id,
			        sc.asset_id,
			        da.asset_name,
			        sc.encryption,
			        sc.masking,
			        sc.hashing,
			        COALESCE(
			          TO_CHAR(sc.updated_at, 'YYYY-MM-DD HH24:MI:SS'),
			          TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI:SS')
			        ) AS last_updated,
			        sc.updated_at
			 FROM security_controls sc
			 JOIN data_assets da ON da.asset_id = sc.asset_id
			 ORDER BY sc.control_id`,
		);

		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching security controls:", error);
		res.status(500).json({ error: "Failed to fetch security controls" });
	}
};

exports.upsertSecurityControl = async (req, res) => {
	try {
		const { asset_id, encryption, masking, hashing } = req.body;

		if (!asset_id) {
			return res.status(400).json({ error: "asset_id is required" });
		}

		const normalizedAssetId = Number(asset_id);
		if (!Number.isInteger(normalizedAssetId) || normalizedAssetId < 1) {
			return res
				.status(400)
				.json({ error: "asset_id must be a positive integer" });
		}

		const assetCheck = await pool.query(
			"SELECT asset_id FROM data_assets WHERE asset_id = $1",
			[normalizedAssetId],
		);

		if (assetCheck.rows.length === 0) {
			return res.status(404).json({ error: "Data asset not found" });
		}

		const result = await pool.query(
			`INSERT INTO security_controls (asset_id, encryption, masking, hashing, updated_at)
			 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
			 ON CONFLICT (asset_id)
			 DO UPDATE SET
			   encryption = EXCLUDED.encryption,
			   masking = EXCLUDED.masking,
			   hashing = EXCLUDED.hashing,
			   updated_at = CURRENT_TIMESTAMP
			 RETURNING *`,
			[
				normalizedAssetId,
				Boolean(encryption),
				Boolean(masking),
				Boolean(hashing),
			],
		);

		await logAuditEvent({
			userId: req.user?.user_id,
			assetId: normalizedAssetId,
			action: "UPDATE",
		});

		res.status(200).json(result.rows[0]);
	} catch (error) {
		console.error("Error updating security controls:", error);
		res.status(500).json({ error: "Failed to update security controls" });
	}
};
