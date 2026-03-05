const pool = require("../config/db");

exports.assignPiiToAsset = async (req, res) => {
	try {
		const { asset_id, pii_id, column_name } = req.body;

		// Input validation
		if (!asset_id || !pii_id || !column_name) {
			return res.status(400).json({
				error: "Missing required fields: asset_id, pii_id, column_name",
			});
		}

		await pool.query(
			"INSERT INTO asset_pii_mapping(asset_id, pii_id, column_name) VALUES($1,$2,$3)",
			[asset_id, pii_id, column_name],
		);

		res.status(201).json({ message: "PII assigned to asset successfully" });
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
			`SELECT p.pii_name, p.pii_weight, ap.column_name
			FROM asset_pii_mapping ap
			JOIN pii_type p ON ap.pii_id = p.pii_id
			WHERE ap.asset_id = $1`,
			[asset_id],
		);

		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching PII by asset:", error);
		res.status(500).json({ error: "Failed to fetch PII for asset" });
	}
};

exports.removePiiFromAsset = async (req, res) => {
	try {
		const { asset_id, pii_id } = req.body;

		if (!asset_id || !pii_id) {
			return res.status(400).json({
				error: "Missing required fields: asset_id, pii_id",
			});
		}

		await pool.query(
			"DELETE FROM asset_pii_mapping WHERE asset_id = $1 AND pii_id = $2",
			[asset_id, pii_id],
		);

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
		const { asset_id, pii_id, column_name } = req.body;

		if (!asset_id || !pii_id || !column_name) {
			return res.status(400).json({
				error: "Missing required fields: asset_id, pii_id, column_name",
			});
		}

		await pool.query(
			"UPDATE asset_pii_mapping SET column_name = $1 WHERE asset_id = $2 AND pii_id = $3",
			[column_name, asset_id, pii_id],
		);

		res.status(200).json({ message: "PII mapping updated successfully" });
	} catch (error) {
		console.error("Error updating PII mapping:", error);
		res.status(500).json({ error: "Failed to update PII mapping" });
	}
};
