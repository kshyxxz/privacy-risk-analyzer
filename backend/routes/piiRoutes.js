const express = require("express");
const router = express.Router();
const piiController = require("../controllers/piiController");

router.get("/", piiController.getAllPii);
router.post("/", piiController.createPii);
router.put("/:id", piiController.updatePii);
router.delete("/:id", piiController.deletePii);

module.exports = router;
