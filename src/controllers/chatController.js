const Chat = require("../models/chat.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");

/* =========================
   START CHAT
========================= */

const receiverId = chat.participants.find(
  (p) => p.toString() !== meId.toString()
);

// 1. Simpan notifikasi ke database
await Notification.create({
  user: receiverId,
  fromUser: meId,
  text,
  chatId,
  isRead: false,
});

// 2. Emit notifikasi realtime via socket.io
const io = req.app.get("io");
const onlineUsers = req.app.get("onlineUsers");

if (io) {
  const receiverSocketId = onlineUsers.get(receiverId.toString());

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("chat:notification", {
      text,
      chatId,
      senderId: meId,
      avatarUrl: req.user.avatarUrl,
      senderName: req.user.displayName,
      senderUsername: req.user.username,
      createdAt: new Date().toISOString(),
    });
  }
}
exports.startChat = async (req, res) => {
  try {
    const meId = req.session.userId;
    const { userId } = req.body;

    if (!meId) return res.status(401).json({ message: "Unauthorized" });
    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (meId.toString() === userId.toString()) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    }

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: "User not found" });

    let chat = await Chat.findOne({
      participants: { $all: [meId, userId], $size: 2 },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [meId, userId],
        messages: [],
      });
    }

    res.json(chat);
  } catch (err) {
    console.error("START CHAT ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* =========================
   GET MESSAGES
========================= */
exports.getMessages = async (req, res) => {
  try {
    const meId = req.session.userId;
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId).populate(
      "messages.sender",
      "username displayName avatarUrl"
    );

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    res.json(chat.messages);
  } catch (err) {
    console.error("GET MESSAGES ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* =========================
   SEND MESSAGE
========================= */
exports.sendMessage = async (req, res) => {
  try {
    const meId = req.session.userId;
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim())
      return res.status(400).json({ message: "Text required" });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const newMessage = {
      sender: meId,
      text: text.trim(),
      createdAt: new Date(),
    };

    chat.messages.push(newMessage);
    chat.lastMessage = text.trim();
    await chat.save();

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    if (io) {
      io.to(chatId).emit("new_message", newMessage);

      const receiverId = chat.participants.find(
        (p) => p.toString() !== meId.toString()
      );

      const receiverSocket = onlineUsers.get(receiverId.toString());
      if (receiverSocket) {
        io.to(receiverSocket).emit("chat:notification", {
          text,
          senderId: meId,
          chatId,
        });
      }
    }

    res.status(201).json(newMessage);
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/* =========================
   GET CHAT LIST
========================= */
exports.getChatList = async (req, res) => {
  try {
    const userId = req.session.userId;

    const chats = await Chat.find({
      participants: { $in: [userId] },
    })
      .populate("participants", "displayName username avatarUrl")
      .sort({ updatedAt: -1 })
      .lean();

    res.json(chats);
  } catch (err) {
    console.error("CHAT LIST ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
