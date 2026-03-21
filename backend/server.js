require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();

const assetRoutes = require("./routes/asset/assetRoutes");
const piiRoutes = require("./routes/pii/piiRoutes");
const permissionRoutes = require("./routes/permission/permissionRoutes");
const auditRoutes = require("./routes/audit/auditRoutes");
const assetPiiRoutes = require("./routes/asset-pii/assetPiiRoutes");
const authRoutes = require("./routes/auth/authRoutes");
const riskRoutes = require("./routes/risk/riskRoutes");
const userRoutes = require("./routes/user/userRoutes");
const roleRoutes = require("./routes/role/roleRoutes");
const securityControlRoutes = require("./routes/security-control/securityControlRoutes");
const initializeDatabase = require("./initDb");

app.use(cors());
app.use(express.json());

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

app.get("/health", (req, res) => {
	res.json({ status: "Server is running" });
});

const PORT = process.env.PORT || 5000;

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
