/* ------------------------------ Create token ------------------------------ */
const jwt = require("jsonwebtoken");

const generateToken = (userId, email, role) => {
  return jwt.sign({ id: userId, email, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

module.exports = generateToken;
