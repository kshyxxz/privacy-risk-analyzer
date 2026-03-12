const pool = require("../../config/db");

// GET /api/audit?user_id=1&asset_id=2
exports.getAllLogs = async (req, res) => {
	try {
		const { user_id, asset_id } = req.query;
		let query = `
		SELECT a.log_id,
					 COALESCE(u.username, 'Deleted User') AS username,
					 CASE 
						 WHEN a.asset_id IS NULL THEN 'All Assets'
						 ELSE COALESCE(d.asset_name, 'Deleted Asset')
					 END AS asset_name,
					 a.action,
					 a.timestamp
    FROM audit_logs a
		LEFT JOIN users u ON a.user_id = u.user_id
		LEFT JOIN data_assets d ON a.asset_id = d.asset_id
    WHERE 1=1
  `;
		const params = [];

		if (user_id) {
			params.push(user_id);
			query += ` AND a.user_id = $${params.length}`;
		}

		if (asset_id) {
			params.push(asset_id);
			query += ` AND a.asset_id = $${params.length}`;
		}

		query += ` ORDER BY a.timestamp DESC`;

		const result = await pool.query(query, params);

		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching audit logs:", error);
		res.status(500).json({ error: "Failed to fetch audit logs" });
	}
};
