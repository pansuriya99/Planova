const mongoose = require("mongoose");

/* ------------------------------- Goal schema ------------------------------ */
const GoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      default: "New Habit",
    },
    repeat: {
      type: String,
      enum: ["daily", "weekly"],
      default: "daily",
    },
    selectedDays: {
      type: [String],
      default: [],
      validate: {
        validator: function (days) {
          const validDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          const repeatType = this.repeat;

          this._repeatForError = repeatType;

          if (repeatType === "daily") return days.length === 0;
          return days.every((day) => validDays.includes(day));
        },
        message: function () {
          return `Invalid selectedDays for repeat type "${this._repeatForError}".`;
        },
      },
    },
    frequency: {
      type: Number,
      default: 1,
      min: 1,
    },
    notification: {
      type: Boolean,
      default: false,
    },
    notifyTime: {
      type: String,
      default: "",
    },
    area: {
      type: String,
      enum: ["Personal", "Work", "Health", "General", "Study"],
      default: "Personal",
    },
    completed: {
      type: Map,
      of: Boolean,
      default: {},
    },
    pinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goal", GoalSchema);
