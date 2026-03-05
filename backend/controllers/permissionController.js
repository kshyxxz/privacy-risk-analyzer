const pool = require("../config/db");

exports.getAllPermissions = async (req, res) => {
	const result = await pool.query(`
    SELECT ap.permission_id,
           r.role_name,
           d.asset_name,
           ap.access_type
    FROM access_permission ap
    JOIN role r ON ap.role_id = r.role_id
    JOIN data_asset d ON ap.asset_id = d.asset_id
    ORDER BY ap.permission_id
  `);

	res.json(result.rows);
};

exports.createPermission = async (req, res) => {
	const { role_id, asset_id, access_type } = req.body;

	const result = await pool.query(
		`INSERT INTO access_permission (role_id, asset_id, access_type)
     VALUES ($1,$2,$3) RETURNING *`,
		[role_id, asset_id, access_type],
	);

	res.json(result.rows[0]);
};

exports.updatePermission = async (req, res) => {
	const { id } = req.params;
	const { role_id, asset_id, access_type } = req.body;

	await pool.query(
		`UPDATE access_permission
     SET role_id=$1, asset_id=$2, access_type=$3
     WHERE permission_id=$4`,
		[role_id, asset_id, access_type, id],
	);

	res.json({ message: "Permission updated" });
};

exports.deletePermission = async (req, res) => {
	const { id } = req.params;

	await pool.query("DELETE FROM access_permission WHERE permission_id=$1", [
		id,
	]);

	res.json({ message: "Permission deleted" });
};
