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

// --------------------
// BODY PARSER
// --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// CORS FIX (Railway → Vercel)
// --------------------
app.use(
  cors({
    origin: "https://rumpi-one.vercel.app",
    credentials: true,
  })
);

// --------------------
// SESSION FIX
// --------------------
const mongoUrl = process.env.MONGO_URL || process.env.MONGO_URI;

app.use(
  session({
    name: "nextjs-auth-session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: mongoUrl,
      collectionName: "sessions",
      ttl: 14 * 24 * 60 * 60,
    }),

    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

// --------------------
// ROUTES
// --------------------
app.use("/api/auth", authRoutes); // register, login manual
app.use("/api/auth", googleAuthRoutes); // google login
app.use("/api", notificationRoutes);
app.use("/api", userRoutes);
app.use("/api", chatRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

module.exports = app;
