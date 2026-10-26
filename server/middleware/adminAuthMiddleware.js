const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const AuditLog = require("../models/AuditLog");

/**
 * Middleware: Verify admin JWT token and active admin status
 */
const verifyAdminToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Admin authorization token required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || decoded.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admin privileges required" });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ message: "Admin account not found" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: "This admin account has been deactivated" });
    }

    req.user = decoded;
    req.admin = admin;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Admin session expired. Please sign in again." });
    }
    return res.status(401).json({ message: "Invalid or malformed admin token." });
  }
};

/**
 * Helper to record administrative audit events
 */
const recordAdminAudit = async ({
  admin,
  action,
  targetType,
  targetId = "",
  targetTitle = "",
  details = {},
  req = null,
}) => {
  try {
    const ip = req ? req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "" : "";
    await AuditLog.create({
      adminId: admin._id || admin.id,
      adminEmail: admin.email,
      action,
      targetType,
      targetId: String(targetId),
      targetTitle: String(targetTitle),
      details,
      ipAddress: String(ip),
    });
  } catch (err) {
    console.error("[AuditLog Error]", err.message);
  }
};

module.exports = {
  verifyAdminToken,
  recordAdminAudit,
};
