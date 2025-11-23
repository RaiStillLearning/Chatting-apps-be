const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController.js");

console.log("AUTH:", authController); // sudah defined

router.get("/auth/google", authController.googleAuth);
router.get("/auth/google/callback", authController.googleCallback);

module.exports = router;
