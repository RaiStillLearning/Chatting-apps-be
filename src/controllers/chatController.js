// controllers/chatController.js
const Chat = require("../models/chat.model");
const User = require("../models/user.model");

// START / GET EXISTING CHAT
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

// GET MESSAGES (Embedded)
exports.getMessages = async (req, res) => {
  try {
    const meId = req.session.userId;
    const { chatId } = req.params;

    if (!meId) return res.status(401).json({ message: "Unauthorized" });

    const chat = await Chat.findById(chatId).populate(
      "messages.sender",
      "username displayName avatarUrl"
    );

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    if (!chat.participants.some((p) => p.toString() === meId.toString())) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Return messages array dari chat document
    res.json(chat.messages);
  } catch (err) {
    console.error("GET MESSAGES ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// SEND MESSAGE (Embedded)
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

    // Push message ke array
    const newMessage = {
      sender: meId,
      text: text.trim(),
      createdAt: new Date(),
    };

    chat.messages.push(newMessage);
    chat.lastMessage = text.trim();
    await chat.save();

    // Populate sender info untuk response
    await chat.populate("messages.sender", "username displayName avatarUrl");

    const savedMessage = chat.messages[chat.messages.length - 1];

    // Emit to socket
    const io = req.app.get("io");
    if (io) {
      io.to(chatId.toString()).emit("new_message", savedMessage);
    }

    res.status(201).json(savedMessage);
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET CHAT LIST
exports.getChatList = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const chats = await Chat.find({
      participants: { $in: [userId] },
    })
      .sort({ updatedAt: -1 })
      .populate("participants", "displayName username avatarUrl")
      .limit(50)
      .lean();

    const result = chats.map((chat) => {
      const otherUser = chat.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );

      return {
        _id: chat._id,
        participants: chat.participants,
        otherUser: otherUser || null,
        lastMessage: chat.lastMessage || "",
        updatedAt: chat.updatedAt,
      };
    });

    res.json(result);
  } catch (err) {
    console.error("CHAT LIST ERROR:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
