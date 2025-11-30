const Goal = require("../models/goal");

/* ------------------------------- Create goal ------------------------------ */
exports.createGoal = async (req, res) => {
  try {
    const {
      title,
      repeat,
      selectedDays,
      frequency,
      notification,
      notifyTime,
      area,
      color,
    } = req.body;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const repeatType = repeat || "daily";

    let days = [];
    if (repeatType === "weekly") {
      days = Array.isArray(selectedDays) ? selectedDays : [];
    }

    const newGoal = new Goal({
      userId: req.user.id,
      title,
      repeat: repeatType,
      selectedDays: days,
      frequency: frequency || 1,
      notification: notification || false,
      notifyTime: notifyTime || "",
      area: area || "Personal",
      color: color || "#FF6384",
    });

    const savedGoal = await newGoal.save();

    res.status(201).json({
      success: true,
      message: "Goal created successfully",
      data: savedGoal,
    });
  } catch (error) {
    console.error("createGoal error:", error);
    res.status(500).json({
      message: "Failed to create goal",
      error: error.message,
    });
  }
};

/* ------------------------------ Get all goals ----------------------------- */
exports.getGoals = async (req, res) => {
  try {
    let goals;

    if (req.user.role === "admin") {
      goals = await Goal.find()
        .populate("userId", "fullName email")
        .sort({ pinned: -1, createdAt: -1 });
    } else {
      goals = await Goal.find({ userId: req.user.id }).sort({
        pinned: -1,
        createdAt: -1,
      });
    }

    res.status(200).json({
      success: true,
      count: goals.length,
      data: goals,
    });
  } catch (error) {
    console.error("getGoals error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch goals",
      error: error.message,
    });
  }
};

/* ----------------------------- Get goal by id ----------------------------- */
exports.getGoalById = async (req, res) => {
  try {
    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.status(200).json({ success: true, data: goal });
  } catch (error) {
    console.error("getGoalById error:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch goal", error: error.message });
  }
};

/* ------------------------------- Update goal ------------------------------ */
exports.updateGoal = async (req, res) => {
  try {
    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: req.body }, // IMPORTANT — apply incoming updates
      { new: true, runValidators: true }
    );

    if (!updatedGoal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.status(200).json({
      success: true,
      message: "Goal updated successfully",
      data: updatedGoal,
    });
  } catch (error) {
    console.error("updateGoal error:", error);
    res.status(500).json({
      message: "Failed to update goal",
      error: error.message,
    });
  }
};

/* ------------------------------- Delete goal ------------------------------ */
exports.deleteGoal = async (req, res) => {
  try {
    const deletedGoal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deletedGoal) {
      return res.status(404).json({ message: "Goal not found" });
    }

    res.status(200).json({
      success: true,
      message: "Goal deleted successfully",
    });
  } catch (error) {
    console.error("deleteGoal error:", error);
    res
      .status(500)
      .json({ message: "Failed to delete goal", error: error.message });
  }
};
