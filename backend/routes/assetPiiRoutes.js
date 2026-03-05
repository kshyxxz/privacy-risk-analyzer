const express = require("express");
const router = express.Router();
const assetPiiController = require("../controllers/assetPiiController");

router.post("/assign", assetPiiController.assignPiiToAsset);
router.get("/:asset_id", assetPiiController.getPiiByAsset);

module.exports = router;
