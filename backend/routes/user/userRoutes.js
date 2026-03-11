const express = require("express");
const router = express.Router();
const {
	getUsers,
	getUserById,
	updateUser,
	deleteUser,
} = require("../../controllers/user/userController");
const {
	verifyToken,
	verifyAdminRole,
} = require("../../middleware/authMiddleware");

router.get("/", verifyToken, getUsers);
router.get("/:id", verifyToken, getUserById);
router.put("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, verifyAdminRole, deleteUser);

module.exports = router;

