const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");

const app = express();

// ✅ 1. BODY PARSER HARUS DI ATAS ROUTE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 2. CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// ✅ 3. SESSION
app.use(
  session({
    name: "nextjs-auth-session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
      sameSite: "lax",
    },
  })
);

// ✅ 4. ROUTES (HARUS SETELAH express.json)
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);

//user routes
const userRoutes = require("./routes/userRoutes");
app.use("/api/auth/users", userRoutes);

app.get("/", (req, res) => {
  res.send("API is running...");
});

module.exports = app;
