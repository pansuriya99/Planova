const mongoose = require("mongoose");

/* ------------------------------ Users schema ------------------------------ */
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, default: null },
    googleId: { type: String, default: null },
    avatar: { type: String, default: null },
    // isPaid: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true, collection: "users" }
);

module.exports = mongoose.model("User", userSchema);
