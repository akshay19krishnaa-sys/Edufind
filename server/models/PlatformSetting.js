const mongoose = require("mongoose");

const platformSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    label: {
      type: String,
      default: "",
    },
    group: {
      type: String,
      enum: ["general", "admissions", "verification", "moderation", "appearance"],
      default: "general",
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    lastUpdatedBy: {
      type: String,
      default: "System",
    },
  },
  { timestamps: true }
);

const PlatformSetting = mongoose.model("PlatformSetting", platformSettingSchema);

module.exports = PlatformSetting;
