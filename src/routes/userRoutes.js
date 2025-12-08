const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

router.get("/users/search", userController.searchUsers);
router.get("/users/:username", userController.getUserByUsername);
router.put("/users/me", userController.uploadAvatar, userController.updateMe);

module.exports = router;
