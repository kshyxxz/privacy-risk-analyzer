const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
	const token = req.headers.authorization?.split(" ")[1];

	console.log("🔐 Token verification requested");
	console.log(
		"   Authorization header:",
		req.headers.authorization?.substring(0, 20) + "...",
	);

	if (!token) {
		console.log("   ❌ No token found");
		return res
			.status(401)
			.json({ error: "No token provided. Please login." });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		console.log(
			"   ✅ Token valid. User:",
			decoded.username,
			"Role:",
			decoded.role,
		);
		req.user = decoded;
		next();
	} catch (error) {
		console.error("   ❌ Token verification failed:", error.message);
		return res
			.status(401)
			.json({ error: "Invalid or expired token. Please login again." });
	}
};

exports.verifyAdminRole = (req, res, next) => {
	if (req.user?.role !== "Admin") {
		return res
			.status(403)
			.json({ error: "Access denied. Admin role required." });
	}
	next();
};

exports.verifyAnalystRole = (req, res, next) => {
	if (!["Admin", "Analyst"].includes(req.user?.role)) {
		return res
			.status(403)
			.json({ error: "Access denied. Analyst or Admin role required." });
	}
	next();
};
