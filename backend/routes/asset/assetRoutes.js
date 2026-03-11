const express = require("express");
const router = express.Router();
const assetController = require("../../controllers/asset/assetController");
const {
	verifyToken,
	verifyAdminRole,
} = require("../../middleware/authMiddleware");

router.get("/", verifyToken, assetController.getAssets);
router.post("/", verifyToken, verifyAdminRole, assetController.createAsset);
router.delete(
	"/:id",
	verifyToken,
	verifyAdminRole,
	assetController.deleteAsset,
);

module.exports = router;

