const User = require("../models/user.model");

/* =========================
   PROTECT MIDDLEWARE (SESSION BASED)
========================= */
const protect = async (req, res, next) => {
  try {
    console.log("SESSION DI PROTECT:", req.session);

    // 1. Pastikan user sudah login (ada session)
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        message: "Unauthorized. Silakan login.",
      });
    }

    // 2. Ambil user dari database
    const user = await User.findById(req.session.userId).select(
      "-passwordHash"
    );

    if (!user) {
      return res.status(401).json({
        message: "User tidak ditemukan.",
      });
    }

    // 3. Simpan ke req
    req.user = user;

    // 4. Lanjut
    next();
  } catch (error) {
    console.error("AUTH MIDDLEWARE ERROR:", error);
    res.status(500).json({
      message: "Terjadi kesalahan di middleware auth.",
      error: error.message,
    });
  }
};

module.exports = { protect };
