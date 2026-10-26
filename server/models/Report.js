const mongoose = require("mongoose");

const REPORT_STATUSES = ["pending", "under_review", "resolved", "dismissed"];
const REPORT_TARGETS = ["review", "course", "institute", "other"];

const reportSchema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: REPORT_TARGETS,
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    targetTitle: {
      type: String,
      default: "",
    },
    reportedContent: {
      type: String,
      default: "",
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      default: "",
      trim: true,
    },
    reporterName: {
      type: String,
      default: "Anonymous User",
      trim: true,
    },
    reporterEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: "pending",
      index: true,
    },
    moderatorNotes: {
      type: String,
      default: "",
    },
    actionTaken: {
      type: String,
      default: "none", // none, content_removed, content_hidden, dismissed
    },
    resolvedBy: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);

module.exports = Report;
module.exports.REPORT_STATUSES = REPORT_STATUSES;
module.exports.REPORT_TARGETS = REPORT_TARGETS;
