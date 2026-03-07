const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");
const { verifyToken } = require("../middleware/authMiddleware");

// List all logs with optional filters
router.get("/", verifyToken, auditController.getAllLogs);

module.exports = router;
