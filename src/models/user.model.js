const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    displayName: {
      type: String,
      required: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      // boleh kosong untuk user Google
    },

    avatarUrl: {
      type: String,
    },

    provider: {
      type: String,
      enum: ["credentials", "google"],
      default: "credentials",
    },

    googleId: {
      type: String,
    },

    // ✅ UNTUK FORGOT PASSWORD
    resetToken: { type: String },
    resetTokenExpire: { type: Date },
  },
  { timestamps: true }
);

// Safety agar tidak error saat hot reload
const User = mongoose.models.User || mongoose.model("User", UserSchema);
module.exports = User;
