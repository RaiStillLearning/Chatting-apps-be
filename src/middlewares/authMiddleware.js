const User = require("../models/user.model");

const protect = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: "Unauthorized. Silakan login." });
    }

    const user = await User.findById(req.session.userId).select(
      "-passwordHash"
    );

    if (!user) {
      return res.status(401).json({ message: "User tidak ditemukan." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("AUTH ERROR:", error);
    res.status(500).json({ message: "Middleware error." });
  }
};

module.exports = { protect };
