const express = require("express");
const {
  register,
  login,
  googleAuth,
  continueWithGoogle,
} = require("../controllers/auth.controller");

const router = express.Router();

/* -------------------------- Authentication Routes ------------------------- */
router.post("/register", register);

router.post("/login", login);

router.get("/google", googleAuth);
router.get("/continue-with-google", continueWithGoogle);

module.exports = router;
