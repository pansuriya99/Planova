const express = require("express");
const authRoutes = require("./auth.routes");
const noteRoutes = require("./note.routes");
const taskRoutes = require("./task.routes");
const eventRoutes = require("./event.routes");
const transactionRoutes = require("./transaction.routes");
const goalRoutes = require("./goal.routes");
const userRoutes = require("./user.routes");

const router = express.Router();

/* ------------------------------- Auth Routes ------------------------------ */
router.use("/auth", authRoutes);

/* ------------------------------ Notes Routes ------------------------------ */
router.use("/notes", noteRoutes);

/* ------------------------------- Tasks Routes ------------------------------ */
router.use("/tasks", taskRoutes);

/* ------------------------------ Events Routes ----------------------------- */
router.use("/events", eventRoutes);

/* --------------------------- Transactions Routes -------------------------- */
router.use("/transactions", transactionRoutes);

/* ------------------------------ Goals Routes ------------------------------ */
router.use("/goals", goalRoutes);

/* ------------------------------ User Routes ------------------------------ */
router.use("/", userRoutes);

module.exports = router;
