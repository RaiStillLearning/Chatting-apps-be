const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const { v4: uuidv4 } = require("uuid");

/* =========================
   SIGNUP (Next.js Simple)
========================= */
exports.signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password || !confirmPassword)
      return res.status(400).json({ message: "Semua field wajib diisi" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Password tidak sama" });

    if (password.length < 6)
      return res.status(400).json({ message: "Password minimal 6 karakter" });

    const emailExist = await User.findOne({ email });
    if (emailExist)
      return res.status(400).json({ message: "Email sudah terdaftar" });

    // generate username otomatis
    let base = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    let username = base;
    let count = 1;

    while (await User.findOne({ username })) {
      username = `${base}${count++}`;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      displayName: name,
      username,
      email,
      passwordHash,
      provider: "credentials",
    });

    req.session.userId = user._id;

    return res.status(201).json({
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
   REGISTER (Manual)
========================= */
exports.register = async (req, res) => {
  try {
    const { displayName, username, email, password, confirmPassword } =
      req.body;

    if (!displayName || !username || !email || !password || !confirmPassword)
      return res.status(400).json({ message: "Semua field wajib diisi" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Password tidak sama" });

    if (await User.findOne({ email }))
      return res.status(400).json({ message: "Email sudah terdaftar" });

    if (await User.findOne({ username }))
      return res.status(400).json({ message: "Username sudah digunakan" });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      displayName,
      username,
      email,
      passwordHash,
      provider: "credentials",
    });

    req.session.userId = user._id;

    return res.status(201).json({
      message: "Register berhasil",
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   LOGIN
========================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !user.passwordHash)
      return res.status(400).json({ message: "Akun tidak valid" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Password salah" });

    req.session.userId = user._id;

    return res.json({
      message: "Login berhasil",
      user: {
        id: user._id,
        displayName: user.displayName,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   LOGOUT
========================= */
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("nextjs-auth-session", {
      secure: true,
      sameSite: "none",
    });

    res.json({ message: "Logout berhasil" });
  });
};

/* =========================
   GET CURRENT USER /me
========================= */
exports.me = async (req, res) => {
  try {
    if (!req.session.userId)
      return res.status(401).json({ message: "Belum login" });

    const user = await User.findById(req.session.userId).select(
      "-passwordHash"
    );

    return res.json(user);
  } catch (err) {
    console.error("ME ERROR:", err);
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
    if (!user)
      return res.status(404).json({ message: "Email tidak ditemukan" });

    const token = uuidv4();
    user.resetToken = token;
    user.resetTokenExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    return res.json({ message: "Token reset dibuat", token });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================
   RESET PASSWORD
========================= */
exports.resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetToken: req.params.token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Token tidak valid" });

    user.passwordHash = await bcrypt.hash(req.body.password, 10);
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    res.json({ message: "Password berhasil direset" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
