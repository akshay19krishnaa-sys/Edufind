const Application = require("../models/Application");
const { recordAdminAudit } = require("../middleware/adminAuthMiddleware");

/**
 * List all admission applications across the platform
 * GET /api/admin/applications
 */
const getAdminApplications = async (req, res) => {
  try {
    const {
      status = "all",
      search = "",
      instituteId = "",
      course = "",
      startDate = "",
      endDate = "",
      page = 1,
      limit = 15,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (status !== "all") {
      query.status = status;
    }

    if (instituteId) {
      query.institute = instituteId;
    }

    if (course.trim()) {
      query.course = new RegExp(course.trim(), "i");
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ fullName: regex }, { email: regex }, { phone: regex }, { course: regex }];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const [totalCount, applications, statusCounts] = await Promise.all([
      Application.countDocuments(query),
      Application.find(query)
        .populate("student", "name email phone qualification")
        .populate("institute", "name location isVerified contactEmail")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Application.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0,
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
      applications,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch platform applications", error: err.message });
  }
};

/**
 * Get detailed application by ID
 * GET /api/admin/applications/:id
 */
const getAdminApplicationDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id)
      .populate("student")
      .populate("institute");

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    return res.status(200).json({ success: true, application });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load application details", error: err.message });
  }
};

/**
 * Administrative Decision Override (Audited)
 * PATCH /api/admin/applications/:id/override
 */
const overrideApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, decisionNotes = "", reason = "Administrative resolution" } = req.body;

    if (!status || !["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Valid status (pending, accepted, rejected) required" });
    }

    const application = await Application.findById(id).populate("institute", "name");
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    const previousStatus = application.status;
    application.status = status;
    application.decisionDate = new Date();
    application.decisionNotes = decisionNotes
      ? `${decisionNotes} (Admin Action: ${reason})`
      : `Status updated by administrator (${reason})`;

    await application.save();

    await recordAdminAudit({
      admin: req.admin,
      action: "APPLICATION_STATUS_OVERRIDE",
      targetType: "Application",
      targetId: application._id,
      targetTitle: `${application.fullName} - ${application.institute?.name || "Institute"}`,
      details: {
        previousStatus,
        newStatus: status,
        reason,
        decisionNotes,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Application status updated to ${status}`,
      application,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update application", error: err.message });
  }
};

module.exports = {
  getAdminApplications,
  getAdminApplicationDetails,
  overrideApplicationStatus,
};
