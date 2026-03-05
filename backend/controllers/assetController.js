const pool = require("../config/db");

exports.getAssets = async (req, res) => {
	try {
		const result = await pool.query("SELECT * FROM data_assets");
		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching assets:", error);
		res.status(500).json({ error: "Failed to fetch assets" });
	}
};

exports.createAsset = async (req, res) => {
	try {
		const { asset_name, db_name, table_name } = req.body;

		// Input validation
		if (!asset_name || !db_name || !table_name) {
			return res.status(400).json({
				error: "Missing required fields: asset_name, db_name, table_name",
			});
		}

		const result = await pool.query(
			"INSERT INTO data_asset(asset_name, db_name, table_name) VALUES($1,$2,$3) RETURNING *",
			[asset_name, db_name, table_name],
		);

		res.status(201).json(result.rows[0]);
	} catch (error) {
		console.error("Error creating asset:", error);
		res.status(500).json({ error: "Failed to create asset" });
	}
};
