const { OAuth2Client } = require("google-auth-library");
const User = require("../model/user.model");
const { signAuthToken } = require("../lib/jwt");

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// STEP 1: Redirect ke Google
exports.googleAuth = (req, res) => {
  const redirectPath = req.query.redirect || "/Rumpi/Dashboard";

  const url = client.generateAuthUrl({
    access_type: "offline",
    scope: ["profile", "email"],
    state: encodeURIComponent(redirectPath),
  });

  res.redirect(url);
};

// STEP 2: Callback dari Google Auth
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
      const usernameBase = payload.email.split("@")[0];
      const username = usernameBase.toLowerCase().replace(/[^a-z0-9]/g, "");

      user = await User.create({
        email: payload.email,
        username,
        displayName: payload.name,
        avatarUrl: payload.picture,
        provider: "google",
        googleId: payload.sub,
      });
    }

    const token = signAuthToken({ userId: user._id });

    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    });

    return res.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_URL}/Auth/callback?redirect=${redirectPath}`
    );
  } catch (err) {
    console.error(err);
    return res.redirect(
      `${process.env.NEXT_PUBLIC_FRONTEND_URL}/Auth/callback?error=auth_failed`
    );
  }
};
