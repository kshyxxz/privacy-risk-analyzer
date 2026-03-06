const pool = require("../config/db");

exports.getAssets = async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT data_asset.*, LOWER(COALESCE(sensitivity_level, '')) AS risk_level FROM data_asset ORDER BY asset_id",
		);
		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching assets:", error);
		res.status(500).json({ error: "Failed to fetch assets" });
	}
};

exports.createAsset = async (req, res) => {
	try {
		const {
			asset_name,
			db_name,
			table_name,
			sensitivity_level,
			contains_pii,
			created_by,
		} = req.body;

		console.log("📝 Create Asset Request:", {
			asset_name,
			db_name,
			table_name,
			sensitivity_level,
			contains_pii,
			created_by,
		});

		// Input validation
		if (!asset_name) {
			return res.status(400).json({
				error: "Missing required field: asset_name",
			});
		}

		let normalizedCreatedBy = null;
		if (
			created_by !== undefined &&
			created_by !== null &&
			created_by !== ""
		) {
			normalizedCreatedBy = Number(created_by);
			if (
				!Number.isInteger(normalizedCreatedBy) ||
				normalizedCreatedBy < 1
			) {
				return res.status(400).json({
					error: "created_by must be a positive integer",
				});
			}
		}

		const normalizedContainsPii = Boolean(contains_pii);

		console.log("🔧 Normalized values:", {
			normalizedCreatedBy,
			normalizedContainsPii,
		});

		const result = await pool.query(
			"INSERT INTO data_asset(asset_name, db_name, table_name, sensitivity_level, contains_pii, created_by) VALUES($1,$2,$3,$4,$5,$6) RETURNING *",
			[
				asset_name,
				db_name || null,
				table_name || null,
				sensitivity_level || null,
				normalizedContainsPii,
				normalizedCreatedBy,
			],
		);

		console.log("✅ Asset created:", result.rows[0]);
		res.status(201).json(result.rows[0]);
	} catch (error) {
		console.error("❌ Error creating asset:", error);
		res.status(500).json({ error: "Failed to create asset" });
	}
};
