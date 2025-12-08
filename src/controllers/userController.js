const User = require("../models/user.model.js");
const multer = require("multer");

// Multer untuk menangkap file upload
const storage = multer.memoryStorage();
exports.uploadAvatar = multer({ storage }).single("avatar");

// =============================
// SEARCH USERS
// =============================
exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.q || "";

    if (!query.trim()) return res.json([]);

    const users = await User.find({
      $or: [
        { displayName: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    })
      .limit(20)
      .select("displayName username avatarUrl");

    return res.json(users);
  } catch (err) {
    console.error("SEARCH ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// =============================
// GET USER BY USERNAME
// =============================
exports.getUserByUsername = async (req, res) => {
  try {
    const username = req.params.username;

    const user = await User.findOne({ username }).select(
      "displayName username email avatarUrl provider createdAt"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    return res.json(user);
  } catch (err) {
    console.error("GET USER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// =============================
// UPDATE PROFILE (NAME + PHOTO)
// =============================
exports.updateMe = async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updates = {
      displayName: req.body.displayName,
    };

    // Jika user upload avatar file
    if (req.file) {
      const base64 = req.file.buffer.toString("base64");
      updates.avatarUrl = `data:${req.file.mimetype};base64,${base64}`;
    }

    const updated = await User.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select("-passwordHash");

    return res.json(updated);
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};
