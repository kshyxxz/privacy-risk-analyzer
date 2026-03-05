const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");

// List all logs with optional filters
router.get("/", auditController.getAllLogs);

module.exports = router;
