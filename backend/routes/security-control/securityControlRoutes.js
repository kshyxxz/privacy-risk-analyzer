const express = require("express");
const router = express.Router();
const securityControlController = require("../../controllers/security-control/securityControlController");
const {
	verifyToken,
	verifyAdminRole,
} = require("../../middleware/authMiddleware");

router.get("/", verifyToken, securityControlController.getSecurityControls);
router.post(
	"/",
	verifyToken,
	verifyAdminRole,
	securityControlController.upsertSecurityControl,
);

module.exports = router;

