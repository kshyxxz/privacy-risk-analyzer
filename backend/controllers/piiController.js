const pool = require("../config/db");

exports.getAllPii = async (req, res) => {
	const result = await pool.query("SELECT * FROM pii_type ORDER BY pii_id");
	res.json(result.rows);
};

exports.createPii = async (req, res) => {
	const { pii_name, pii_category, pii_weight } = req.body;

	const result = await pool.query(
		"INSERT INTO pii_type (pii_name, pii_category, pii_weight) VALUES ($1,$2,$3) RETURNING *",
		[pii_name, pii_category, pii_weight],
	);

	res.json(result.rows[0]);
};

exports.updatePii = async (req, res) => {
	const { id } = req.params;
	const { pii_name, pii_category, pii_weight } = req.body;

	await pool.query(
		"UPDATE pii_type SET pii_name=$1, pii_category=$2, pii_weight=$3 WHERE pii_id=$4",
		[pii_name, pii_category, pii_weight, id],
	);

	res.json({ message: "Updated successfully" });
};

exports.deletePii = async (req, res) => {
	const { id } = req.params;

	await pool.query("DELETE FROM pii_type WHERE pii_id=$1", [id]);

	res.json({ message: "Deleted successfully" });
};
