const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const { recordAdminAudit } = require("../middleware/adminAuthMiddleware");

const sanitizeAdmin = (admin) => {
  const data = admin.toObject ? admin.toObject() : { ...admin };
  delete data.password;
  return data;
};

/**
 * Admin Login
 * POST /api/admin/auth/login
 */
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Admin email and password are required" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const admin = await Admin.findOne({ email: normalizedEmail }).select("+password");

    if (!admin) {
      return res.status(401).json({ message: "Invalid administrator credentials" });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: "This administrative account is disabled" });
    }

    const isMatch = await bcrypt.compare(String(password), admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid administrator credentials" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "Server JWT configuration missing" });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        role: "admin",
        isSuperAdmin: admin.isSuperAdmin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    admin.lastLogin = new Date();
    await admin.save();

    await recordAdminAudit({
      admin,
      action: "ADMIN_LOGIN",
      targetType: "Admin",
      targetId: admin._id,
      targetTitle: admin.name,
      details: { email: admin.email },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Admin authentication successful",
      token,
      admin: sanitizeAdmin(admin),
    });
  } catch (err) {
    return res.status(500).json({ message: "Admin login failed", error: err.message });
  }
};

/**
 * Get Authenticated Admin Profile
 * GET /api/admin/auth/me
 */
const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    return res.status(200).json({ success: true, admin: sanitizeAdmin(admin) });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to fetch admin profile", error: err.message });
  }
};

/**
 * Change Admin Password
 * PUT /api/admin/auth/password
 */
const updateAdminPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new passwords are required" });
    }

    if (String(newPassword).length < 8) {
      return res.status(400).json({ success: false, message: "New password must be at least 8 characters long" });
    }

    const admin = await Admin.findById(req.admin._id).select("+password");
    const isMatch = await bcrypt.compare(String(currentPassword), admin.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect current password" });
    }

    admin.password = await bcrypt.hash(String(newPassword), 10);
    await admin.save();

    await recordAdminAudit({
      admin,
      action: "ADMIN_PASSWORD_CHANGED",
      targetType: "Admin",
      targetId: admin._id,
      targetTitle: admin.name,
      details: { email: admin.email },
      req,
    });

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to update password", error: err.message });
  }
};

module.exports = {
  loginAdmin,
  getAdminProfile,
  updateAdminPassword,
  sanitizeAdmin,
};
