const express = require("express");
const router = express.Router();
const googleAuthController = require("../controllers/googleAuthController");

// STEP 1: Redirect ke Google
router.get("/google", googleAuthController.googleAuth);

// STEP 2: Callback Google
router.get("/google/callback", googleAuthController.googleCallback);
router.get("/google/callback", (req, res) => {
  console.log("GOOGLE CALLBACK HIT:", req.query);
});

module.exports = router;
