const Task = require("../models/task");

/* ------------------------------- Create task ------------------------------ */
exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* ------------------------------ Get all tasks ----------------------------- */
exports.getTasks = async (req, res) => {
  try {
    let tasks;

    if (req.user.role === "admin") {
      tasks = await Task.find()
        .sort({ createdAt: -1 })
        .populate("userId", "fullName email");
    } else {
      tasks = await Task.find({ userId: req.user.id }).sort({ createdAt: -1 });
    }

    res.json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ----------------------------- Get task by id ----------------------------- */
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ------------------------------ Updated task ------------------------------ */
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    delete updateData._id;

    const task = await Task.findOneAndUpdate(
      { _id: id.trim(), userId: req.user.id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res.json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* ------------------------------- Delete task ------------------------------ */
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
