const Chat = require("../models/chat.model");
const Message = require("../models/message.model");
const User = require("../models/user.model");

// START / GET EXISTING CHAT DENGAN USER LAIN
exports.startChat = async (req, res) => {
  try {
    const meId = req.session.userId;
    const { userId } = req.body;

    if (!meId) return res.status(401).json({ message: "Unauthorized" });
    if (!userId) return res.status(400).json({ message: "userId is required" });
    if (meId.toString() === userId.toString()) {
      return res.status(400).json({ message: "Cannot chat with yourself" });
    }

    // cek user target beneran ada
    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: "User not found" });

    // cari chat existing
    let chat = await Chat.findOne({
      participants: { $all: [meId, userId], $size: 2 },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [meId, userId],
      });
    }

    res.json(chat);
  } catch (err) {
    console.error("START CHAT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// AMBIL SEMUA MESSAGE DI CHAT
exports.getMessages = async (req, res) => {
  try {
    const meId = req.session.userId;
    const { chatId } = req.params;

    if (!meId) return res.status(401).json({ message: "Unauthorized" });

    // pastikan user bagian dari chat
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    if (!chat.participants.includes(meId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const messages = await Message.find({ chat: chatId })
      .sort({ createdAt: 1 })
      .populate("sender", "username displayName avatarUrl");

    res.json(messages);
  } catch (err) {
    console.error("GET MESSAGES ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// KIRIM MESSAGE (kalau mau via REST, selain socket)
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

    if (!chat.participants.includes(meId)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const message = await Message.create({
      chat: chatId,
      sender: meId,
      text: text.trim(),
    });

    chat.lastMessageAt = new Date();
    await chat.save();

    // emit ke room (kalau kita simpan io di app)
    const io = req.app.get("io");
    if (io) {
      const populatedSender = await message.populate(
        "sender",
        "username displayName avatarUrl"
      );
      io.to(chatId.toString()).emit("new_message", populatedSender);
    }

    res.status(201).json(message);
  } catch (err) {
    console.error("SEND MESSAGE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getChatList = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const chats = await Chat.find({
      members: { $in: [userId] },
    })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    const result = [];

    for (const chat of chats) {
      const otherId = chat.members.find((id) => id.toString() !== userId);
      const otherUser = await User.findById(otherId).select(
        "displayName username avatarUrl"
      );

      result.push({
        chatId: chat._id,
        user: otherUser,
        lastMessage: chat.lastMessage || "",
        updatedAt: chat.updatedAt,
      });
    }

    res.json(result);
  } catch (err) {
    console.error("CHAT LIST ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
