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

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60,
    }),

    cookie: {
      httpOnly: true,
      secure: true, // Railway = HTTPS
      sameSite: "none", // Wajib front-end beda domain
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 hari
    },
  })
);

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
