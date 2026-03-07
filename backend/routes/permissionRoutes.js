const express = require("express");
const router = express.Router();
const permissionController = require("../controllers/permissionController");
const {
	verifyToken,
	verifyAdminRole,
} = require("../middleware/authMiddleware");

router.get("/", verifyToken, permissionController.getAllPermissions);
router.post(
	"/",
	verifyToken,
	verifyAdminRole,
	permissionController.createPermission,
);
router.put(
	"/:id",
	verifyToken,
	verifyAdminRole,
	permissionController.updatePermission,
);
router.delete(
	"/:id",
	verifyToken,
	verifyAdminRole,
	permissionController.deletePermission,
);

module.exports = router;
