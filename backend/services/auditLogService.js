const pool = require("../config/db");

const ALLOWED_ACTIONS = new Set(["READ", "WRITE", "UPDATE", "DELETE"]);
const READ_DEDUP_SECONDS = 120;

async function logAuditEvent({ userId, assetId = null, action }) {
	const normalizedAction = String(action || "").toUpperCase();

	if (!userId || !ALLOWED_ACTIONS.has(normalizedAction)) {
		return;
	}

	try {
		if (normalizedAction === "READ") {
			const recent = await pool.query(
				`SELECT log_id
				 FROM audit_logs
				 WHERE user_id = $1
				   AND action = 'READ'
				   AND ($2::int IS NULL AND asset_id IS NULL OR asset_id = $2)
				   AND timestamp >= NOW() - ($3 * INTERVAL '1 second')
				 ORDER BY timestamp DESC
				 LIMIT 1`,
				[userId, assetId, READ_DEDUP_SECONDS],
			);

			if (recent.rows.length > 0) {
				return;
			}
		}

		await pool.query(
			"INSERT INTO audit_logs (user_id, asset_id, action) VALUES ($1, $2, $3)",
			[userId, assetId, normalizedAction],
		);
	} catch (error) {
		// Logging should never block the main operation.
		console.error("Audit logging failed:", error.message);
	}
}

module.exports = {
	logAuditEvent,
};
