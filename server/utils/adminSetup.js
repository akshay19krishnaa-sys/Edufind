const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const PlatformSetting = require("../models/PlatformSetting");
const Institute = require("../models/Institute");
const Course = require("../models/Course");

const DEFAULT_SETTINGS = [
  {
    key: "platform_name",
    value: "EduFind",
    label: "Platform Name",
    group: "general",
    description: "The public name of the portal displayed across the application.",
  },
  {
    key: "support_email",
    value: "support@edufind.com",
    label: "Support Email",
    group: "general",
    description: "Primary contact email shown to students and institutes.",
  },
  {
    key: "support_phone",
    value: "+91 98765 43210",
    label: "Support Phone",
    group: "general",
    description: "Support hotline number.",
  },
  {
    key: "admissions_enabled",
    value: true,
    label: "Student Admissions Enabled",
    group: "admissions",
    description: "Master switch to accept or temporarily pause new student admission applications.",
  },
  {
    key: "auto_institute_verification",
    value: false,
    label: "Auto-Verify New Institutes",
    group: "verification",
    description: "If disabled, all new institutes remain in pending status until manually verified by an admin.",
  },
  {
    key: "featured_institutes_limit",
    value: 6,
    label: "Featured Institutes Limit",
    group: "appearance",
    description: "Maximum number of featured institutes to display prominently on the home page.",
  },
  {
    key: "review_moderation_enabled",
    value: true,
    label: "Enable Content Moderation Queue",
    group: "moderation",
    description: "Hold reported content for admin evaluation before taking automatic actions.",
  },
];

/**
 * Ensures a default admin account, baseline settings, and course sync exists on startup.
 */
async function initializeAdminSystem() {
  try {
    // 1. Initial Admin Account Setup
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const email = (process.env.ADMIN_EMAIL || "admin@edufind.com").trim().toLowerCase();
      const rawPassword = process.env.ADMIN_PASSWORD || "Admin@12345";
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      await Admin.create({
        name: "EduFind Super Administrator",
        email,
        password: hashedPassword,
        role: "admin",
        isSuperAdmin: true,
        isActive: true,
      });

      console.log(`[AdminSetup] Provisioned initial admin account: ${email}`);
    }

    // 2. Initial Settings Setup
    for (const setting of DEFAULT_SETTINGS) {
      const exists = await PlatformSetting.findOne({ key: setting.key });
      if (!exists) {
        await PlatformSetting.create(setting);
      }
    }

    // 3. Sync courses from institutes if Course collection is empty
    const courseCount = await Course.countDocuments();
    if (courseCount === 0) {
      const institutes = await Institute.find();
      for (const inst of institutes) {
        if (Array.isArray(inst.courses) && inst.courses.length > 0) {
          for (const courseName of inst.courses) {
            if (courseName && courseName.trim()) {
              await Course.create({
                institute: inst._id,
                title: courseName.trim(),
                fees: inst.fees || 0,
                duration: inst.duration || "Flexible",
                category: "Professional Training",
                level: "All Levels",
                status: inst.isVerified ? "published" : "pending",
              });
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("[AdminSetup] Initialization error:", err.message);
  }
}

module.exports = {
  initializeAdminSystem,
};
