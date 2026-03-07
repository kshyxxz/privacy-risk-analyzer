const express = require("express");
const router = express.Router();
const assetPiiController = require("../controllers/assetPiiController");
const {
	verifyToken,
	verifyAdminRole,
} = require("../middleware/authMiddleware");

router.post(
	"/assign",
	verifyToken,
	verifyAdminRole,
	assetPiiController.assignPiiToAsset,
);
router.get("/:asset_id", verifyToken, assetPiiController.getPiiByAsset);
router.delete(
	"/remove",
	verifyToken,
	verifyAdminRole,
	assetPiiController.removePiiFromAsset,
);
router.put(
	"/update",
	verifyToken,
	verifyAdminRole,
	assetPiiController.updateAssetPiiMapping,
);

module.exports = router;
