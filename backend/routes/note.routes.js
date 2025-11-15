const express = require("express");
const router = express.Router();
const noteController = require("../controllers/note.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// Protect all note routes
router.use(authMiddleware);

router.post("/", noteController.createNote);
router.get("/", noteController.getNotes);
router.get("/:id", noteController.getNoteById);
router.put("/:id", noteController.updateNote);
router.delete("/:id", noteController.deleteNote);

module.exports = router;
