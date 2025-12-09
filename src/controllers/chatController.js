const Chat = require("../models/chat.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");

/* =========================
   START CHAT
========================= */
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

    if (!meId) return res.status(401).json({ message: "Unauthorized" });
    if (!text || !text.trim())
      return res.status(400).json({ message: "Text is required" });

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    if (!chat.participants.some((p) => p.toString() === meId.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const newMessage = {
      sender: meId,
      text: text.trim(),
      createdAt: new Date(),
    };

    chat.messages.push(newMessage);
    chat.lastMessage = text.trim();
    await chat.save();

    // --- Populate sender
    await chat.populate("participants", "username displayName avatarUrl");

    const savedMessage = chat.messages[chat.messages.length - 1];

    // --- Identify receiver
    const receiver = chat.participants.find(
      (p) => p._id.toString() !== meId.toString()
    );

    // --- Save notification
    await Notification.create({
      user: receiver._id,
      fromUser: meId,
      text: text.trim(),
      chatId: chat._id,
      isRead: false,
    });

    // --- Emit NOTIFICATION SOCKET
    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    if (io && onlineUsers.has(receiver._id.toString())) {
      const receiverSocket = onlineUsers.get(receiver._id.toString());

      io.to(receiverSocket).emit("chat:notification", {
        senderId: meId,
        senderName: chat.participants.find(
          (p) => p._id.toString() === meId.toString()
        ).displayName,
        avatarUrl: chat.participants.find(
          (p) => p._id.toString() === meId.toString()
        ).avatarUrl,
        text: text.trim(),
        chatId: chat._id,
      });
    }

    // --- Emit message to room
    // Populate sender agar socket mengirim data lengkap
    const populatedMessage = await Chat.populate(savedMessage, {
      path: "sender",
      select: "displayName username avatarUrl",
    });

    // Emit realtime message
    io.to(chatId.toString()).emit("new_message", populatedMessage);

    res.status(201).json(populatedMessage);
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
