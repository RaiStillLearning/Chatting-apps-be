const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user.model");

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

/* =========================
   STEP 1: REDIRECT KE GOOGLE
========================= */
exports.googleAuth = (req, res) => {
  const redirectPath = req.query.redirect || "/Rumpi/Dashboard";

  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
    prompt: "select_account", // ⭐ Fix user stuck login loop
    state: encodeURIComponent(redirectPath),
  });

  return res.redirect(url);
};

/* =========================
   STEP 2: CALLBACK GOOGLE
========================= */
exports.googleCallback = async (req, res) => {
  const code = req.query.code;
  const redirectPath = decodeURIComponent(
    req.query.state || "/Rumpi/Dashboard"
  );

  try {
    const { tokens } = await client.getToken(code);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });

    if (!user) {
      const base = payload.email.split("@")[0];
      let username = base.toLowerCase().replace(/[^a-z0-9]/g, "");
      let count = 1;

      // Pastikan username unique
      while (await User.findOne({ username })) {
        username = `${base}${count++}`;
      }

      user = await User.create({
        email: payload.email,
        username,
        displayName: payload.name,
        avatarUrl: payload.picture,
        provider: "google",
        googleId: payload.sub,
      });
    }

    req.session.userId = user._id;

    // ⭐ FIX: Tunggu session tersimpan di MongoDB
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // ⭐ Redirect langsung ke Dashboard (skip /Auth/callback)
    return res.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_URL}${redirectPath}`
    );
  } catch (err) {
    console.error("GOOGLE AUTH ERROR:", err);
    return res.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_URL}/Auth/Login?error=auth_failed`
    );
  }
};
