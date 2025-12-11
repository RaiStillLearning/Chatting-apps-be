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

// ⭐ HARUS SEBELUM SESSION
app.set("trust proxy", 1);

// ⭐ PARSER
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ⭐ CORS
app.use(
  cors({
    origin: ["https://rumpi-one.vercel.app", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type"],
  })
);

// ⭐ SESSION
app.use(
  session({
    name: "nextjs-auth-session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: true,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
    }),
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7,
      path: "/",
      domain: "rumpi-one.vercel.app", // INI WAJIB DALAM KONDISI KAMU
    },
  })
);

// ⭐ DEBUG LOGGING
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

// ⭐ ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api", notificationRoutes);
app.use("/api", userRoutes);
app.use("/api", chatRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "API Running",
    session: req.session,
  });
});

module.exports = app;
