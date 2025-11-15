const User = require("../models/user");

/* --------------------------- Get logged-in user --------------------------- */
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const email = req.user.email;

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const isAdmin =
      email.toLowerCase().startsWith("admin") || user.role === "admin";

    res.json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: isAdmin ? "admin" : "user",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(" Error in getMe:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ------------------------ Get all registered users ------------------------ */
exports.getAllUsers = async (req, res) => {
  try {
    const email = req.user.email;
    const isAdmin =
      email.toLowerCase().startsWith("admin") || req.user.role === "admin";

    if (!isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied. Admins only." });
    }

    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      total: users.length,
      users,
    });
  } catch (error) {
    console.error(" Error in getAllUsers:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* ------------------------ Delete user (Admin only) ------------------------ */
exports.deleteUser = async (req, res) => {
  try {
    const email = req.user.email;
    const isAdmin =
      email.toLowerCase().startsWith("admin") || req.user.role === "admin";

    if (!isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied. Admins only." });
    }

    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    console.error(" Error deleting user:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
