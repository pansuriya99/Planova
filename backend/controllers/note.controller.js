const Note = require("../models/note");

/* ------------------------------- Create note ------------------------------ */
exports.createNote = async (req, res) => {
  try {
    const {
      title,
      content,
      tags = [],
      color = "#FFFFFF",
      pinned = false,
    } = req.body;

    const note = new Note({
      userId: req.user.id,
      title,
      content,
      tags,
      color,
      pinned,
    });

    await note.save();
    res.status(201).json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ------------------------------ Get all notes ----------------------------- */
exports.getNotes = async (req, res) => {
  try {
    let notes;

    if (req.user.role === "admin") {
      notes = await Note.find()
        .populate("userId", "fullName email")
        .sort({ createdAt: -1 });
    } else {
      notes = await Note.find({ userId: req.user.id }).sort({ createdAt: -1 });
    }

    res.json({ success: true, data: notes });
  } catch (error) {
    console.error("getNotes error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ----------------------------- Get note by id ----------------------------- */
exports.getNoteById = async (req, res) => {
  try {
    const note = await Note.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });
    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ------------------------------- Update note ------------------------------ */
exports.updateNote = async (req, res) => {
  try {
    const { title, content, tags, color, pinned } = req.body;

    const noteId = req.params.id.trim();

    const note = await Note.findOneAndUpdate(
      { _id: noteId, userId: req.user.id },
      { title, content, tags, color, pinned, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    res.json({ success: true, note });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/* ------------------------------- Delete note ------------------------------ */
exports.deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });
    if (!note)
      return res
        .status(404)
        .json({ success: false, message: "Note not found" });
    res.json({ success: true, message: "Note deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
