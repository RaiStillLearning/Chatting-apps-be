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

// ⭐ MUST untuk Railway
app.set("trust proxy", 1);

// ⭐ Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⭐ CORS - BEFORE session
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, origin); // 🔥 izinkan domain mana pun yang datang
    },
    credentials: true,
  })
);

// ⭐ SESSION CONFIG
if (!process.env.MONGO_URI) {
  console.error("❌ ERROR: MONGO_URI tidak ditemukan!");
  process.exit(1);
}
app.set("trust proxy", 1);

app.use(
  session({
    name: "nextjs-auth-session",
    secret: process.env.SESSION_SECRET || "fallback-secret",
    resave: false,
    saveUninitialized: false,
    proxy: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      touchAfter: 24 * 3600,
    }),
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
    },
  })
);

// ⭐ Debug Logging
app.use((req, res, next) => {
  console.log("📍 REQUEST", {
    path: req.path,
    method: req.method,
    origin: req.get("origin"),
    cookie: req.headers.cookie,
    sessionID: req.sessionID,
    userId: req.session?.userId,
  });
  next();
});

// ⭐ Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api", notificationRoutes);
app.use("/api", userRoutes);
app.use("/api", chatRoutes);

// Default route
app.get("/", (req, res) => {
  res.json({
    message: "API Running",
    session: req.session,
  });
});

module.exports = app;
