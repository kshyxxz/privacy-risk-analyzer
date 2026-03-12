const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
	const token = req.headers.authorization?.split(" ")[1];

	if (!token) {
		return res
			.status(401)
			.json({ error: "No token provided. Please login." });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
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
