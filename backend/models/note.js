const mongoose = require("mongoose");

/* ------------------------------- Note schema ------------------------------ */
const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: false },
    content: { type: String, required: false },
    tags: { type: [String], default: [] },
    color: { type: String, default: "#ffffff" },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);
