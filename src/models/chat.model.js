// models/chat.model.js
const mongoose = require("mongoose");

const MessageSubSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
); // Tetap generate _id untuk setiap message

const ChatSchema = new mongoose.Schema(
  {
    participants: [
      {
        // ✅ Ganti 'members' jadi 'participants'
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    messages: [MessageSubSchema],
    lastMessage: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", ChatSchema);
