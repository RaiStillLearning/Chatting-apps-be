// models/message.model.js
const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
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
  },
  { timestamps: true }
);

// Index untuk query performa
MessageSchema.index({ chat: 1, createdAt: 1 });

module.exports = mongoose.model("Message", MessageSchema);
