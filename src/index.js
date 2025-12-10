const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo"); // ✔ FIX: import benar
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// --------------------
// BODY PARSER
// --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// CORS (FIX FOR RAILWAY + NEXTJS)
// --------------------
app.use(
  cors({
    origin: "https://rumpi-one.vercel.app", // domain FE kamu
    credentials: true,
  })
);

// --------------------
// SESSION (FIXED VERSION, ONLY ONE!)
// --------------------
app.use(
  session({
    name: "nextjs-auth-session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URL,
      ttl: 14 * 24 * 60 * 60, // simpan session 14 hari
    }),

    cookie: {
      httpOnly: true,
      secure: true, // ✔ WAJIB untuk Production (Railway HTTPS)
      sameSite: "none", // ✔ WAJIB untuk cookie cross-domain
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 hari
    },
  })
);

// --------------------
// LIST ROUTES
// --------------------
const list = require("express-list-endpoints");
console.log(list(app));

console.log(">>> FILE index.js TERLOAD <<<");

// --------------------
// ROUTES
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);
app.use("/api", notificationRoutes);
app.use("/api", userRoutes);
app.use("/api", chatRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

// --------------------
module.exports = app;
