const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { logAuditEvent } = require("../services/auditLogService");

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

		const selectedRole = role || "Analyst";

		// Check if trying to create an Admin when one already exists
		if (selectedRole === "Admin") {
			const adminCheckResult = await pool.query(
				"SELECT user_id FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'Admin' LIMIT 1",
			);

			if (adminCheckResult.rows.length > 0) {
				return res.status(403).json({
					error: "An admin user already exists. Only one admin account is allowed.",
				});
			}
		}

		const roleResult = await pool.query(
			"SELECT role_id, role_name FROM roles WHERE role_name = $1",
			[selectedRole],
		);

		if (roleResult.rows.length === 0) {
			return res.status(400).json({
				error: "Invalid role. Available roles are Admin, Analyst, Intern.",
			});
		}

		const roleId = roleResult.rows[0].role_id;

		console.log("   Role ID:", roleId);

		// Create new user
		const result = await pool.query(
			"INSERT INTO users (username, email, password_hash, role_id) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email, role_id",
			[username, email, hashedPassword, roleId],
		);

		const user = result.rows[0];
		const roleName = roleResult.rows[0].role_name;

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

		await logAuditEvent({
			userId: user.user_id,
			assetId: null,
			action: "WRITE",
		});

		const token = jwt.sign(
			{
				user_id: user.user_id,
				username: user.username,
				email: user.email,
				role: roleName,
			},
			process.env.JWT_SECRET,
			{ expiresIn: process.env.JWT_EXPIRY || "7d" },
		);

		res.status(201).json({
			message: "User registered successfully",
			token,
			user: {
				user_id: user.user_id,
				username: user.username,
				email: user.email,
				role: roleName,
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
			`SELECT u.user_id, u.username, u.email, u.password_hash, r.role_name
			 FROM users u
			 LEFT JOIN roles r ON u.role_id = r.role_id
			 WHERE u.username = $1`,
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

		const roleName = user.role_name || "Analyst";

		// Generate JWT token
		const token = jwt.sign(
			{
				user_id: user.user_id,
				username: user.username,
				email: user.email,
				role: roleName,
			},
			process.env.JWT_SECRET,
			{ expiresIn: process.env.JWT_EXPIRY || "7d" },
		);

		res.status(200).json({
			message: "Login successful",
			token,
			user: {
				user_id: user.user_id,
				username: user.username,
				email: user.email,
				role: roleName,
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

exports.checkAdminExists = async (req, res) => {
	try {
		const result = await pool.query(
			"SELECT user_id FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'Admin' LIMIT 1",
		);

		res.status(200).json({
			exists: result.rows.length > 0,
		});
	} catch (error) {
		console.error("Error checking admin existence:", error);
		res.status(500).json({ error: "Failed to check admin status" });
	}
};
