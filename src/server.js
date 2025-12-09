require("dotenv").config();
const connectDB = require("./config/Db");
const app = require("./index");
const http = require("http");
const { Server } = require("socket.io");

// 1. Connect MongoDB
connectDB();

// 2. Buat HTTP server manual dari Express
const server = http.createServer(app);

// 3. Pasang Socket.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

// 4. Simpan io supaya bisa dipakai di controller (send message)
app.set("io", io);

// 5. Jalankan socket
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`Socket ${socket.id} joined room ${chatId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// 6. Start server
server.listen(5000, "0.0.0.0", () => {
  console.log("🚀 Server is running on port 5000");
  console.log("👉 http://localhost:5000");
});
