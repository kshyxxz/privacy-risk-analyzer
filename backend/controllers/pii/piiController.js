const pool = require("../../config/db");
const { logAuditEvent } = require("../../services/auditLogService");

exports.getAllPii = async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT * FROM pii_types ORDER BY pii_id",
		);

		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching PII types:", error);
		res.status(500).json({ error: "Failed to fetch PII types" });
	}
};

exports.createPii = async (req, res) => {
	try {
		const { pii_name, pii_category, pii_weight } = req.body;

		// Input validation
		if (!pii_name || !pii_category || pii_weight === undefined) {
			return res.status(400).json({
				error: "Missing required fields: pii_name, pii_category, pii_weight",
			});
		}

		const result = await pool.query(
			"INSERT INTO pii_types (pii_name, pii_category, pii_weight) VALUES ($1,$2,$3) RETURNING *",
			[pii_name, pii_category, pii_weight],
		);

		await logAuditEvent({
			userId: req.user?.user_id,
			assetId: null,
			action: "WRITE",
		});

		res.status(201).json(result.rows[0]);
	} catch (error) {
		console.error("Error creating PII type:", error);
		res.status(500).json({ error: "Failed to create PII type" });
	}
};

exports.updatePii = async (req, res) => {
	try {
		const { id } = req.params;
		const { pii_name, pii_category, pii_weight } = req.body;

		if (!id || !pii_name || !pii_category || pii_weight === undefined) {
			return res.status(400).json({
				error: "Missing required fields: id, pii_name, pii_category, pii_weight",
			});
		}

		await pool.query(
			"UPDATE pii_types SET pii_name=$1, pii_category=$2, pii_weight=$3 WHERE pii_id=$4",
			[pii_name, pii_category, pii_weight, id],
		);

		await logAuditEvent({
			userId: req.user?.user_id,
			assetId: null,
			action: "UPDATE",
		});

		res.status(200).json({ message: "PII type updated successfully" });
	} catch (error) {
		console.error("Error updating PII type:", error);
		res.status(500).json({ error: "Failed to update PII type" });
	}
};

exports.deletePii = async (req, res) => {
	try {
		const { id } = req.params;

		if (!id) {
			return res.status(400).json({ error: "PII ID is required" });
		}

		const deleted = await pool.query(
			"DELETE FROM pii_types WHERE pii_id=$1 RETURNING pii_id",
			[id],
		);

		if (deleted.rows.length === 0) {
			return res.status(404).json({ error: "PII type not found" });
		}

		await logAuditEvent({
			userId: req.user?.user_id,
			assetId: null,
			action: "DELETE",
		});

		res.status(200).json({ message: "PII type deleted successfully" });
	} catch (error) {
		console.error("Error deleting PII type:", error);
		res.status(500).json({ error: "Failed to delete PII type" });
	}
};

