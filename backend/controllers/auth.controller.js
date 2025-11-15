const bcrypt = require("bcrypt");
const User = require("../models/user");
const generateToken = require("../utils/generate.token");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const axios = require("axios");
const qs = require("querystring");

/* ------------------------------ Register API ------------------------------ */
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const role = email.toLowerCase().startsWith("admin") ? "admin" : "user";

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
    });

    const token = generateToken(user._id, user.email, user.role);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      role: user.role,
    });
  } catch (error) {
    console.error("Register error:", error);
    next(error);
  }
};

/* -------------------------------- Login API ------------------------------- */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.password)
      return res
        .status(400)
        .json({ message: "Use Google login for this account" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = generateToken(user._id, user.email, user.role);

    res.json({
      success: true,
      message: "Login successful",
      token,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};

/* ------------------------ Continue with Google API ------------------------ */
exports.googleAuth = async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).json({ message: "Code is required" });

    const { data } = await axios.post(
      "https://oauth2.googleapis.com/token",
      qs.stringify({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { id_token: tokenId } = data;
    if (!tokenId)
      return res.status(400).json({ message: "Google tokenId missing" });

    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      const role = email.toLowerCase().startsWith("admin") ? "admin" : "user";

      user = await User.create({
        fullName: name,
        email,
        password: null,
        googleId,
        avatar: picture,
        role,
      });
    }

    const token = generateToken(user._id, user.email, user.role);

    const redirectUrl =
      user.role === "admin"
        ? `http://localhost:5173/admin?token=${token}`
        : `http://localhost:5173/dashboard?token=${token}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error("Google Auth error:", error);
    next(error);
  }
};

/* ------------------------ Continue with Google API ------------------------ */
exports.continueWithGoogle = async (req, res, next) => {
  try {
    const client_id = process.env.GOOGLE_CLIENT_ID;
    const redirect_uri = process.env.GOOGLE_REDIRECT_URI;

    const scope = encodeURIComponent(
      "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email"
    );

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}&access_type=offline&prompt=consent`;

    res.redirect(authUrl);
  } catch (error) {
    console.error("ContinueWithGoogle error:", error);
    next(error);
  }
};
