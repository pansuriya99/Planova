const express = require("express");
const {
  getMe,
  getAllUsers,
  deleteUser,
} = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

/* ---------------------- Get Logged-in User Info ---------------------- */
router.get("/me", authMiddleware, getMe);

router.get("/users", authMiddleware, getAllUsers);
router.delete("/users/:id", authMiddleware, deleteUser);

module.exports = router;
