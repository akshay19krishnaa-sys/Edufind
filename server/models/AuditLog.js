const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: false,
    },
    adminEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    targetType: {
      type: String,
      required: true,
      enum: ["Student", "Institute", "Application", "Course", "Report", "Review", "Transaction", "Setting", "Admin"],
      index: true,
    },
    targetId: {
      type: String,
      default: "",
    },
    targetTitle: {
      type: String,
      default: "",
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
