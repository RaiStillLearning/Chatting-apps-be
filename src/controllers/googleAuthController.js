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
  try {
    const code = req.query.code;
    const redirectPath = decodeURIComponent(
      req.query.state || "/Rumpi/Dashboard"
    );

    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      user = await User.create({
        email: payload.email,
        username: payload.email.split("@")[0],
        displayName: payload.name,
        avatarUrl: payload.picture,
        provider: "google",
        googleId: payload.sub,
      });
    }

    req.session.userId = user._id;

    req.session.save(() => {
      // 🔥 FIX: redirect ke callback NEXTJS, bukan /Auth/callback
      res.redirect(
        `${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/auth/google/callback?redirect=${redirectPath}`
      );
    });
  } catch (err) {
    console.error(err);
    res.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_URL}/api/auth/google/callback?error=1`
    );
  }
};
