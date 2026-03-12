const express = require("express");
const router = express.Router();
const piiController = require("../../controllers/pii/piiController");
const {
	verifyToken,
	verifyAdminRole,
} = require("../../middleware/authMiddleware");

router.get("/", verifyToken, piiController.getAllPii);
router.post("/", verifyToken, verifyAdminRole, piiController.createPii);
router.put("/:id", verifyToken, verifyAdminRole, piiController.updatePii);
router.delete("/:id", verifyToken, verifyAdminRole, piiController.deletePii);

module.exports = router;

