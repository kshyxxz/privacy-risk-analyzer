const pool = require("../config/db");

exports.assignPiiToAsset = async (req, res) => {
	const { asset_id, pii_id, column_name } = req.body;

	await pool.query(
		"INSERT INTO asset_pii_mapping(asset_id, pii_id, column_name) VALUES($1,$2,$3)",
		[asset_id, pii_id, column_name],
	);

	res.json({ message: "PII assigned to asset" });
};

exports.getPiiByAsset = async (req, res) => {
	const { asset_id } = req.params;

	const result = await pool.query(
		`SELECT p.pii_name, p.pii_weight, ap.column_name
		FROM asset_pii_mapping ap
		JOIN pii_type p ON ap.pii_id = p.pii_id
		WHERE ap.asset_id = $1`,
		[asset_id],
	);

	res.json(result.rows);
};
