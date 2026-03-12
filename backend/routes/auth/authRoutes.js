const express = require("express");
const router = express.Router();
const authController = require("../../controllers/auth/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/check-admin-exists", authController.checkAdminExists);

module.exports = router;

