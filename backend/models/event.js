const mongoose = require("mongoose");

/* ------------------------------ Event schema ------------------------------ */
const eventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    startDateTime: { type: Date, required: true },
    endDateTime: { type: Date, required: true },
    // linkedTaskId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Task",
    //   default: null,
    // },
    reminder: { type: Date, default: null },
    recurring: {
      type: String,
      enum: ["None", "Daily", "Weekly", "Monthly"],
      default: "None",
    },
    color: { type: String, default: "#000000" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
