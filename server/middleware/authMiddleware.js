const jwt = require("jsonwebtoken");

/**
 * Verify JWT token from Authorization header (Bearer token)
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, ... }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please sign in again." });
    }
    return res.status(401).json({ message: "Invalid or malformed token." });
  }
};

/**
 * Enforce role on protected routes (e.g. "institute", "student")
 */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({
        message: `Forbidden: requires ${role} role`,
      });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole,
};
