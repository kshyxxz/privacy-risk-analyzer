require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const assetRoutes = require("./routes/assetRoutes");
const piiRoutes = require("./routes/piiRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const auditRoutes = require("./routes/auditRoutes");
const assetPiiRoutes = require("./routes/assetPiiRoutes");
const authRoutes = require("./routes/authRoutes");
const riskRoutes = require("./routes/riskRoutes");
const userRoutes = require("./routes/userRoutes");
const roleRoutes = require("./routes/roleRoutes");
const securityControlRoutes = require("./routes/securityControlRoutes");
const initializeDatabase = require("./initDb");

app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
	console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
	next();
});

app.use("/api/assets", assetRoutes);
app.use("/api/pii", piiRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/asset-pii", assetPiiRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/security-controls", securityControlRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
	res.json({ status: "Server is running" });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
initializeDatabase()
	.then(() => {
		app.listen(PORT, () => {
			console.log(`✅ Server running on port ${PORT}`);
		});
	})
	.catch((err) => {
		console.error("❌ Failed to initialize database:", err);
		process.exit(1);
	});
