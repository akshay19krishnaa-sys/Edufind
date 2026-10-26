const PlatformSetting = require("../models/PlatformSetting");
const { recordAdminAudit } = require("../middleware/adminAuthMiddleware");

/**
 * Get all platform settings
 * GET /api/admin/settings
 */
const getPlatformSettings = async (req, res) => {
  try {
    const settings = await PlatformSetting.find().sort({ group: 1, key: 1 });
    const settingsMap = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });

    return res.status(200).json({
      success: true,
      settings,
      settingsMap,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch platform settings", error: err.message });
  }
};

/**
 * Update platform settings
 * PUT /api/admin/settings
 */
const updatePlatformSettings = async (req, res) => {
  try {
    const { settings } = req.body; // e.g. { platform_name: "EduFind", admissions_enabled: true }

    if (!settings || typeof settings !== "object") {
      return res.status(400).json({ message: "Settings object is required" });
    }

    const updatedKeys = [];

    for (const [key, value] of Object.entries(settings)) {
      // Validate that secret settings aren't editable via this API
      if (key.includes("secret") || key.includes("password") || key.includes("token")) {
        continue;
      }

      const existing = await PlatformSetting.findOne({ key });
      if (existing) {
        existing.value = value;
        existing.lastUpdatedBy = req.admin.email;
        await existing.save();
        updatedKeys.push(key);
      }
    }

    await recordAdminAudit({
      admin: req.admin,
      action: "PLATFORM_SETTINGS_UPDATED",
      targetType: "Setting",
      targetId: "global",
      targetTitle: "Platform Configuration",
      details: { updatedKeys },
      req,
    });

    const refreshed = await PlatformSetting.find().sort({ group: 1, key: 1 });
    return res.status(200).json({
      success: true,
      message: "Platform settings updated successfully",
      settings: refreshed,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update platform settings", error: err.message });
  }
};

module.exports = {
  getPlatformSettings,
  updatePlatformSettings,
};
