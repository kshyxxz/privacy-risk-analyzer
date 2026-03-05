const pool = require("../config/db");

exports.getUsers = async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT user_id, username, email FROM public.user ORDER BY user_id",
		);

		res.status(200).json(result.rows);
	} catch (error) {
		console.error("Error fetching users:", error);
		res.status(500).json({ error: "Failed to fetch users" });
	}
};

exports.getUserById = async (req, res) => {
	try {
		const { id } = req.params;

		if (!id) {
			return res.status(400).json({ error: "User ID is required" });
		}

		const result = await pool.query(
			"SELECT user_id, username, email FROM public.user WHERE user_id = $1",
			[id],
		);

		if (result.rows.length === 0) {
			return res.status(404).json({ error: "User not found" });
		}

		res.status(200).json(result.rows[0]);
	} catch (error) {
		console.error("Error fetching user:", error);
		res.status(500).json({ error: "Failed to fetch user" });
	}
};

exports.updateUser = async (req, res) => {
	try {
		const { id } = req.params;
		const { username, email } = req.body;

		if (!id || !username || !email) {
			return res.status(400).json({
				error: "Missing required fields: id, username, email",
			});
		}

		await pool.query(
			"UPDATE public.user SET username = $1, email = $2 WHERE user_id = $3",
			[username, email, id],
		);

		res.status(200).json({ message: "User updated successfully" });
	} catch (error) {
		console.error("Error updating user:", error);
		res.status(500).json({ error: "Failed to update user" });
	}
};

exports.deleteUser = async (req, res) => {
	try {
		const { id } = req.params;

		if (!id) {
			return res.status(400).json({ error: "User ID is required" });
		}

		await pool.query("DELETE FROM public.user WHERE user_id = $1", [id]);

		res.status(200).json({ message: "User deleted successfully" });
	} catch (error) {
		console.error("Error deleting user:", error);
		res.status(500).json({ error: "Failed to delete user" });
	}
};
