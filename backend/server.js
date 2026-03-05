require("dotenv").config();
const express = require("express");
const app = express();

const assetRoutes = require("./routes/assetRoutes");
const piiRoutes = require("./routes/piiRoutes");
const permissionRoutes = require("./routes/permissionRoutes");
const auditRoutes = require("./routes/auditRoutes");
const assetPiiRoutes = require("./routes/assetPiiRoutes");

app.use(express.json());

app.use("/api/assets", assetRoutes);
app.use("/api/pii", piiRoutes);
app.use("/api/permissions", permissionRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/asset-pii", assetPiiRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
