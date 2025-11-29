const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const { v4: uuidv4 } = require("uuid");

/* =========================
   SIGNUP (UNTUK NEXT.JS)
========================= */
exports.signup = async (req, res) => {
  try {
    console.log("SIGNUP BODY:", req.body); // ✅ DEBUG (penting)
    console.log("✅ MASUK KE SIGNUP");

    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password tidak sama" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password minimal 6 karakter" });
    }

    const emailExist = await User.findOne({ email });
    if (emailExist) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    // ✅ AUTO GENERATE USERNAME DARI EMAIL
    let usernameBase = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    let username = usernameBase;
    let counter = 1;

    while (await User.findOne({ username })) {
      username = `${usernameBase}${counter++}`;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      displayName: name, // ✅ MAPPING BENAR
      username,
      email,
      passwordHash,
      provider: "credentials",
    });

    req.session.userId = user._id;

    res.status(201).json({
      message: "Signup berhasil",
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("SIGNUP ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   REGISTER (MANUAL)
========================= */
exports.register = async (req, res) => {
  console.log("❌ MASUK KE REGISTER");
  try {
    const { displayName, username, email, password, confirmPassword } =
      req.body;

    if (!displayName || !username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: "Semua field wajib diisi" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Password tidak sama" });
    }

    const emailExist = await User.findOne({ email });
    if (emailExist) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    const usernameExist = await User.findOne({ username });
    if (usernameExist) {
      return res.status(400).json({ message: "Username sudah digunakan" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      displayName,
      username,
      email,
      passwordHash,
      provider: "credentials",
    });

    req.session.userId = user._id;

    res.status(201).json({
      message: "Register berhasil",
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   LOGIN
========================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash) {
      return res.status(400).json({ message: "Akun tidak valid" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Password salah" });
    }

    req.session.userId = user._id;

    res.json({
      message: "Login berhasil",
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   LOGOUT
========================= */
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ message: "Logout berhasil" });
  });
};

/* =========================
   ME (SESSION CHECK)
========================= */
exports.me = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Belum login" });
    }

    const user = await User.findById(req.session.userId).select(
      "-passwordHash"
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   FORGOT PASSWORD
========================= */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email tidak ditemukan" });
    }

    const token = uuidv4();
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 1000 * 60 * 10;
    await user.save();

    res.json({
      message: "Token reset berhasil dibuat",
      token,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   RESET PASSWORD
========================= */
exports.resetPassword = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token tidak valid" });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    res.json({ message: "Password berhasil direset" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
