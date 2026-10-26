const Report = require("../models/Report");
const Review = require("../models/Review");
const Course = require("../models/Course");
const { recordAdminAudit } = require("../middleware/adminAuthMiddleware");

/**
 * List moderation reports
 * GET /api/admin/moderation/reports
 */
const getModerationReports = async (req, res) => {
  try {
    const { status = "all", targetType = "all", page = 1, limit = 15 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (status !== "all") query.status = status;
    if (targetType !== "all") query.targetType = targetType;

    const [totalCount, reports, statusCounts] = await Promise.all([
      Report.countDocuments(query),
      Report.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Report.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      total: 0,
      pending: 0,
      under_review: 0,
      resolved: 0,
      dismissed: 0,
    };

    statusCounts.forEach((sc) => {
      if (sc._id && stats.hasOwnProperty(sc._id)) {
        stats[sc._id] = sc.count;
      }
      stats.total += sc.count;
    });

    return res.status(200).json({
      success: true,
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      stats,
      reports,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load moderation reports", error: err.message });
  }
};

/**
 * Resolve or Dismiss a Moderation Report
 * PATCH /api/admin/moderation/reports/:id
 */
const resolveModerationReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionTaken, moderatorNotes = "", newStatus = "resolved" } = req.body;

    if (!actionTaken || !["none", "content_removed", "content_hidden", "dismissed"].includes(actionTaken)) {
      return res.status(400).json({ message: "Valid actionTaken (none, content_removed, content_hidden, dismissed) required" });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ message: "Moderation report not found" });
    }

    report.status = actionTaken === "dismissed" ? "dismissed" : newStatus;
    report.actionTaken = actionTaken;
    report.moderatorNotes = moderatorNotes;
    report.resolvedBy = req.admin.email;
    report.resolvedAt = new Date();

    // Take action on target item if needed
    if (actionTaken === "content_removed") {
      if (report.targetType === "review") {
        await Review.findByIdAndUpdate(report.targetId, { status: "removed" });
      } else if (report.targetType === "course") {
        await Course.findByIdAndUpdate(report.targetId, { status: "rejected", rejectionNotes: `Removed via moderation: ${moderatorNotes}` });
      }
    } else if (actionTaken === "content_hidden") {
      if (report.targetType === "review") {
        await Review.findByIdAndUpdate(report.targetId, { status: "flagged" });
      } else if (report.targetType === "course") {
        await Course.findByIdAndUpdate(report.targetId, { status: "hidden" });
      }
    }

    await report.save();

    await recordAdminAudit({
      admin: req.admin,
      action: `REPORT_${actionTaken.toUpperCase()}`,
      targetType: "Report",
      targetId: report._id,
      targetTitle: `${report.targetType}: ${report.targetTitle || report.reason}`,
      details: {
        actionTaken,
        moderatorNotes,
        status: report.status,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Report decision applied successfully",
      report,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to resolve report", error: err.message });
  }
};

/**
 * Public/User endpoint to submit a moderation report
 * POST /api/reports
 */
const submitReport = async (req, res) => {
  try {
    const { targetType, targetId, targetTitle, reportedContent, reason, details, reporterName, reporterEmail } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: "Target type, Target ID, and Reason are required" });
    }

    const report = await Report.create({
      targetType,
      targetId: String(targetId),
      targetTitle: targetTitle || "",
      reportedContent: reportedContent || "",
      reason: String(reason).trim(),
      details: details ? String(details).trim() : "",
      reporterName: reporterName || "Anonymous User",
      reporterEmail: reporterEmail || "",
      status: "pending",
    });

    return res.status(201).json({
      message: "Report submitted successfully. Our safety and moderation team will review it.",
      reportId: report._id,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to submit report", error: err.message });
  }
};

module.exports = {
  getModerationReports,
  resolveModerationReport,
  submitReport,
};
