const User = require("../models/user.model");

exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.q || "";

    if (!query.trim()) {
      return res.json([]);
    }

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
