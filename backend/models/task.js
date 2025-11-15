const mongoose = require("mongoose");

/* ------------------------------- Task schema ------------------------------ */
const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    startDate: { type: Date },
    dueDate: { type: Date },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
    ttodo: [
      {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
      },
    ],
    tags: [String],
    completed: { type: Object, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
