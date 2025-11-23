const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "SUPER_SECRET_RUMPI_DEV_ONLY";

function signAuthToken(payload, expiresIn = "1d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

module.exports = { signAuthToken };
