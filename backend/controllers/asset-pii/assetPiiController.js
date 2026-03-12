const pool = require("../../config/db");
const { logAuditEvent } = require("../../services/auditLogService");
const {
	calculateAssetRisk,
	saveRiskAssessment,
} = require("../../services/riskService");

exports.assignPiiToAsset = async (req, res) => {
	try {
		const { asset_id, mappings } = req.body;

		console.log(
			"[assignPiiToAsset] Received request body:",
			JSON.stringify(req.body, null, 2),
		);

		// Handle both batch and single mapping formats
		let mappingsArray = [];

		if (mappings && Array.isArray(mappings)) {
			// Batch format: { asset_id, mappings: [...] }
			mappingsArray = mappings;
		} else if (asset_id && req.body.pii_id && req.body.column_name) {
			// Single format: { asset_id, pii_id, column_name }
			mappingsArray = [
				{
					asset_id,
					pii_id: req.body.pii_id,
					column_name: req.body.column_name,
				},
			];
		} else {
			console.log("[assignPiiToAsset] ERROR - Invalid request format");
			console.log("  asset_id:", asset_id);
			console.log("  has mappings array:", Array.isArray(mappings));
			console.log("  req.body.pii_id:", req.body.pii_id);
			console.log("  req.body.column_name:", req.body.column_name);
			return res.status(400).json({
				error: "Missing required fields: asset_id and (mappings array OR pii_id, column_name)",
			});
		}

		console.log(
			"[assignPiiToAsset] Processing mappingsArray:",
			JSON.stringify(mappingsArray, null, 2),
		);

		// Validate all mappings have required fields
		for (let i = 0; i < mappingsArray.length; i++) {
			const mapping = mappingsArray[i];
			console.log(`[assignPiiToAsset] Validating mapping ${i}:`, mapping);

			if (
				mapping.asset_id === null ||
				mapping.asset_id === undefined ||
				String(mapping.asset_id).trim() === ""
			) {
				return res.status(400).json({
					error: `Mapping ${i}: asset_id is missing or empty`,
				});
			}
			if (
				mapping.pii_id === null ||
				mapping.pii_id === undefined ||
				String(mapping.pii_id).trim() === ""
			) {
				return res.status(400).json({
					error: `Mapping ${i}: pii_id is missing or empty`,
				});
			}
			if (
				mapping.column_name === null ||
				mapping.column_name === undefined ||
				String(mapping.column_name).trim() === ""
			) {
				return res.status(400).json({
					error: `Mapping ${i}: column_name is missing or empty`,
				});
			}
		}

		// Insert all mappings
		for (const mapping of mappingsArray) {
			await pool.query(
				"INSERT INTO asset_pii_mapping(asset_id, pii_id, column_name) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
				[mapping.asset_id, mapping.pii_id, mapping.column_name],
			);
		}
		// Log audit event for the first asset in mappings
		if (mappingsArray.length > 0) {
			await logAuditEvent({
				userId: req.user?.user_id,
				assetId: mappingsArray[0].asset_id,
				action: "WRITE",
			});
		}

		const uniqueAssetIds = [
			...new Set(mappingsArray.map((m) => m.asset_id)),
		];
		// Recalculate risk for the asset(s) involved
		for (const assetId of uniqueAssetIds) {
			try {
				const risk = await calculateAssetRisk(assetId);
				await saveRiskAssessment(
					assetId,
					risk.riskScore,
					risk.riskLevel,
				);
				console.log(
					`[assignPiiToAsset] Risk recalculated for asset ${assetId}: ${risk.riskLevel} (${risk.riskScore}%)`,
				);
			} catch (riskError) {
				console.error(
					`Error recalculating risk for asset ${assetId}:`,
					riskError,
				);
				// Don't fail the request if risk calculation fails
			}
		}

		res.status(201).json({
			message: `${mappingsArray.length} PII mapping(s) assigned to asset successfully`,
		});
	} catch (error) {
		console.error("Error assigning PII to asset:", error);
		res.status(500).json({ error: "Failed to assign PII to asset" });
	}
};

exports.getPiiByAsset = async (req, res) => {
	try {
		const { asset_id } = req.params;

		// Input validation
		if (!asset_id) {
			return res.status(400).json({ error: "asset_id is required" });
		}

		const result = await pool.query(
			`SELECT ap.mapping_id, p.pii_id, p.pii_name, p.pii_category, p.pii_weight, ap.column_name
			FROM asset_pii_mapping ap
			JOIN pii_types p ON ap.pii_id = p.pii_id
			WHERE ap.asset_id = $1
			ORDER BY ap.mapping_id`,
			[asset_id],
		);

		await logAuditEvent({
			userId: req.user?.user_id,
			assetId: asset_id,
			action: "READ",
		});

		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching PII by asset:", error);
		res.status(500).json({ error: "Failed to fetch PII for asset" });
	}
};

exports.removePiiFromAsset = async (req, res) => {
	try {
		const { mapping_id, asset_id, pii_id } = req.body;

		// Support removing by either mapping_id OR asset_id+pii_id
		let query, params;

		if (mapping_id) {
			query =
				"DELETE FROM asset_pii_mapping WHERE mapping_id = $1 RETURNING asset_id";
			params = [mapping_id];
		} else if (asset_id && pii_id) {
			query =
				"DELETE FROM asset_pii_mapping WHERE asset_id = $1 AND pii_id = $2 RETURNING asset_id";
			params = [asset_id, pii_id];
		} else {
			return res.status(400).json({
				error: "Missing required fields: either mapping_id OR (asset_id AND pii_id)",
			});
		}

		const result = await pool.query(query, params);

		if (result.rows.length === 0) {
			return res.status(404).json({
				error: "PII mapping not found",
			});
		}

		const deletedAssetId = result.rows[0].asset_id;

		await logAuditEvent({
			userId: req.user?.user_id,
			assetId: deletedAssetId,
			action: "DELETE",
		});
		// Recalculate risk for the asset
		try {
			const risk = await calculateAssetRisk(deletedAssetId);
			await saveRiskAssessment(
				deletedAssetId,
				risk.riskScore,
				risk.riskLevel,
			);
			console.log(
				`[removePiiFromAsset] Risk recalculated for asset ${deletedAssetId}: ${risk.riskLevel} (${risk.riskScore}%)`,
			);
		} catch (riskError) {
			console.error(
				`Error recalculating risk for asset ${deletedAssetId}:`,
				riskError,
			);
			// Don't fail the request if risk calculation fails
		}

		res.status(200).json({
			message: "PII removed from asset successfully",
		});
	} catch (error) {
		console.error("Error removing PII from asset:", error);
		res.status(500).json({ error: "Failed to remove PII from asset" });
	}
};

exports.updateAssetPiiMapping = async (req, res) => {
	try {
		const { mapping_id, column_name, asset_id, pii_id } = req.body;

		// Support updating by either mapping_id OR asset_id+pii_id
		let query, params;

		if (mapping_id && column_name) {
			query =
				"UPDATE asset_pii_mapping SET column_name = $1 WHERE mapping_id = $2 RETURNING asset_id";
			params = [column_name, mapping_id];
		} else if (asset_id && pii_id && column_name) {
			query =
				"UPDATE asset_pii_mapping SET column_name = $1 WHERE asset_id = $2 AND pii_id = $3 RETURNING asset_id";
			params = [column_name, asset_id, pii_id];
		} else {
			return res.status(400).json({
				error: "Missing required fields: column_name and (mapping_id OR (asset_id AND pii_id))",
			});
		}

		const result = await pool.query(query, params);

		if (result.rows.length === 0) {
			return res.status(404).json({
				error: "PII mapping not found",
			});
		}

		const updatedAssetId = result.rows[0].asset_id;

		await logAuditEvent({
			userId: req.user?.user_id,
			assetId: updatedAssetId,
			action: "UPDATE",
		});

		res.status(200).json({
			message: "PII mapping updated successfully",
		});
	} catch (error) {
		console.error("Error updating PII mapping:", error);
		res.status(500).json({ error: "Failed to update PII mapping" });
	}
};

