const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { protect } = require("../middlewares/authMiddleware");

// start chat / get or create
router.post("/chats/start", protect, chatController.startChat);

// messages
router.get("/chats/:chatId/messages", protect, chatController.getMessages);
router.post("/chats/:chatId/messages", protect, chatController.sendMessage);

router.get("/chat/list", protect, chatController.getChatList);

module.exports = router;
