const express = require("express");
const router = express.Router();
const googleAuthController = require("../controllers/googleAuthController");

// STEP 1: Redirect ke Google
router.get("/google", googleAuthController.googleAuth);

// STEP 2: Callback Google
router.get("/google/callback", googleAuthController.googleCallback);




module.exports = router;
