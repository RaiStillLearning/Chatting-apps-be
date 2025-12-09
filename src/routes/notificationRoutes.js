const express = require("express");
const router = express.Router();
const Notification = require("../models/notification.model");
const { protect } = require("../middlewares/authMiddleware");

router.get("/notifications", protect, async (req, res) => {
  const userId = req.session.userId;

  const notif = await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  res.json(notif);
});

module.exports = router;
