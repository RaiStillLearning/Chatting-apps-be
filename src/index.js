const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// -----------------------------------------------------
// FIX 1: Body Parser
// -----------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -----------------------------------------------------
// FIX 2: CORS for Next.js on Vercel
// -----------------------------------------------------
app.use(
  cors({
    origin: "https://rumpi-one.vercel.app",
    credentials: true,
  })
);

// -----------------------------------------------------
// FIX 3: SESSION CONFIG (FINAL WORKING VERSION)
// -----------------------------------------------------
if (!process.env.MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI tidak ditemukan di ENV Railway!");
  process.exit(1);
}

app.use(
  session({
    name: "nextjs-auth-session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true, // ⭐ Wajib true di Railway/production
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      touchAfter: 24 * 3600, // Update session setiap 24 jam
    }),
    cookie: {
      httpOnly: true,
      secure: true, // ⭐ Wajib true di production (HTTPS)
      sameSite: "none", // ⭐ Wajib "none" untuk cross-origin
      maxAge: 1000 * 60 * 60 * 24 * 7,
      domain: undefined, // Jangan set domain di Railway
    },
  })
);

// Debug session
app.use((req, res, next) => {
  console.log("🔍 SESSION DEBUG:", {
    sessionID: req.sessionID,
    userId: req.session?.userId,
    cookie: req.session?.cookie,
  });
  next();
});
// -----------------------------------------------------
// FIX 4: ROUTES
// -----------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api", notificationRoutes);
app.use("/api", userRoutes);
app.use("/api", chatRoutes);

// -----------------------------------------------------
app.get("/", (req, res) => {
  res.send("API Running Successfully");
});

module.exports = app;
