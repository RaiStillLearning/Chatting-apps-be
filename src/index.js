const express = require("express");
const session = require("express-session");
const path = require("path");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes");
const googleAuthRoutes = require("./routes/googleAuthRoutes");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

// BODY PARSER
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// SESSION
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

const list = require("express-list-endpoints");
console.log(list(app));

// AUTH ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/auth", googleAuthRoutes);

// USER ROUTES
app.use("/api", userRoutes);

// TEST ROUTE
app.get("/", (req, res) => {
  res.send("API is running...");
});

// CHAT ROUTES
app.use("/api", userRoutes);
app.use("/api", chatRoutes);

// DEBUG: LIST ROUTES (SESUDAH SEMUA ROUTE DIMOUNT)
console.log(">>> FILE index.js TERLOAD <<<");
console.log("ROUTE TERDAFTAR:");

if (app._router && app._router.stack) {
  app._router.stack.forEach((layer) => {
    if (layer.route) {
      const method = layer.route.stack[0].method.toUpperCase();
      console.log(method, layer.route.path);
    } else if (layer.name === "router" && layer.handle.stack) {
      layer.handle.stack.forEach((handler) => {
        if (handler.route) {
          const method = handler.route.stack[0].method.toUpperCase();
          console.log(method, handler.route.path);
        }
      });
    }
  });
} else {
  console.log("Router belum siap pada saat index.js dijalankan.");
}

module.exports = app;
