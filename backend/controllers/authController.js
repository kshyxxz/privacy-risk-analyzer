const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.register = async (req, res) => {
	try {
		const { username, password, email, role } = req.body;

		console.log("\n🔐 REGISTER ENDPOINT CALLED");
		console.log("   Username:", username);
		console.log("   Email:", email);
		console.log("   Password length:", password?.length);
		console.log("   Role:", role);

		// Input validation
		if (!username || !password || !email) {
			return res.status(400).json({
				error: "Missing required fields: username, password, email",
			});
		}

		// Check if user already exists
		const existingUser = await pool.query(
			"SELECT * FROM users WHERE username = $1 OR email = $2",
			[username, email],
		);

		if (existingUser.rows.length > 0) {
			return res.status(409).json({
				error: "User already exists with this username or email",
			});
		}

		// Hash password
		const saltRounds = 10;
		const hashedPassword = await bcrypt.hash(password, saltRounds);
		console.log(
			"   Hashed password:",
			hashedPassword.substring(0, 50) + "...",
		);

		// Get role_id (default to Analyst role)
		let roleId = 2; // Default: Analyst
		if (role === "Admin") {
			roleId = 1;
		} else if (role === "Intern") {
			roleId = 3;
		}

		console.log("   Role ID:", roleId);

		// Create new user
		const result = await pool.query(
			"INSERT INTO users (username, email, password_hash, role_id) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email, role_id",
			[username, email, hashedPassword, roleId],
		);

		const user = result.rows[0];
		const roleMap = { 1: "Admin", 2: "Analyst", 3: "Intern" };

		console.log("   ✅ User created with ID:", user.user_id);
		console.log("   ✅ Checking stored hash...");

		// Verify what was actually stored
		const storedUser = await pool.query(
			"SELECT password_hash FROM users WHERE user_id = $1",
			[user.user_id],
		);
		console.log(
			"   Stored in DB:",
			storedUser.rows[0].password_hash.substring(0, 50) + "...",
		);

		res.status(201).json({
			message: "User registered successfully",
			user: {
				user_id: user.user_id,
				username: user.username,
				email: user.email,
				role: roleMap[user.role_id],
			},
		});
	} catch (error) {
		console.error("❌ Registration error:", {
			message: error.message,
			code: error.code,
			detail: error.detail,
			constraint: error.constraint,
		});

		if (error.code === "23505") {
			return res.status(409).json({
				error: "User already exists with this username or email",
			});
		}

		if (error.code === "23503") {
			return res.status(400).json({
				error: "Invalid role configuration. Please contact admin.",
			});
		}

		return res.status(500).json({
			error: "Failed to register user",
		});
	}
};

exports.login = async (req, res) => {
	try {
		const { username, password } = req.body;

		// Input validation
		if (!username || !password) {
			return res
				.status(400)
				.json({ error: "Missing required fields: username, password" });
		}

		// Find user by username
		const result = await pool.query(
			"SELECT * FROM users WHERE username = $1",
			[username],
		);

		if (result.rows.length === 0) {
			return res
				.status(401)
				.json({ error: "Invalid username or password" });
		}

		const user = result.rows[0];

		// Compare password with hashed password
		const passwordMatch = await bcrypt.compare(
			password,
			user.password_hash,
		);

		if (!passwordMatch) {
			return res
				.status(401)
				.json({ error: "Invalid username or password" });
		}

		const roleMap = { 1: "Admin", 2: "Analyst", 3: "Intern" };

		res.status(200).json({
			message: "Login successful",
			user: {
				user_id: user.user_id,
				username: user.username,
				email: user.email,
				role: roleMap[user.role_id] || "Analyst",
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({ error: "Failed to login" });
	}
};

exports.logout = async (req, res) => {
	try {
		res.status(200).json({ message: "Logged out successfully" });
	} catch (error) {
		console.error("Logout error:", error);
		res.status(500).json({ error: "Failed to logout" });
	}
};
