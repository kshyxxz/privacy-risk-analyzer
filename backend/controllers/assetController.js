const pool = require("../config/db");

exports.getAssets = async (req, res) => {
	const result = await pool.query("SELECT * FROM data_assets");
	res.json(result.rows);
};

exports.createAsset = async (req, res) => {
	const { asset_name, db_name, table_name } = req.body;

	const result = await pool.query(
		"INSERT INTO data_asset(asset_name, db_name, table_name) VALUES($1,$2,$3) RETURNING *",
		[asset_name, db_name, table_name],
	);

	res.json(result.rows[0]);
};
