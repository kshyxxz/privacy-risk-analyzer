const pool = require("../config/db");

// GET /api/audit?user_id=1&asset_id=2
exports.getAllLogs = async (req, res) => {
	const { user_id, asset_id } = req.query;
	let query = `
    SELECT a.log_id, u.username, d.asset_name, a.action, a.timestamp
    FROM audit_log a
    JOIN "user" u ON a.user_id = u.user_id
    JOIN data_asset d ON a.asset_id = d.asset_id
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
	res.json(result.rows);
};
