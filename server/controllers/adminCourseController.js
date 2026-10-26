const Course = require("../models/Course");
const Institute = require("../models/Institute");
const { recordAdminAudit } = require("../middleware/adminAuthMiddleware");

/**
 * List all courses with filtering and search
 * GET /api/admin/courses
 */
const getAdminCourses = async (req, res) => {
  try {
    const { status = "all", search = "", instituteId = "", page = 1, limit = 15 } = req.query;
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

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ title: regex }, { category: regex }, { description: regex }];
    }

    const [totalCount, courses, statusCounts] = await Promise.all([
      Course.countDocuments(query),
      Course.find(query)
        .populate("institute", "name location isVerified contactEmail")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Course.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = {
      total: 0,
      published: 0,
      pending: 0,
      rejected: 0,
      hidden: 0,
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
      courses,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch course catalog", error: err.message });
  }
};

/**
 * Update Course Moderation Status (Approve, Reject, Hide, Publish)
 * PATCH /api/admin/courses/:id/status
 */
const updateCourseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionNotes = "" } = req.body;

    if (!status || !["published", "pending", "rejected", "hidden"].includes(status)) {
      return res.status(400).json({ message: "Valid status (published, pending, rejected, hidden) required" });
    }

    const course = await Course.findById(id).populate("institute", "name courses");
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const previousStatus = course.status;
    course.status = status;
    if (rejectionNotes) {
      course.rejectionNotes = String(rejectionNotes).trim();
    }
    await course.save();

    await recordAdminAudit({
      admin: req.admin,
      action: `COURSE_${status.toUpperCase()}`,
      targetType: "Course",
      targetId: course._id,
      targetTitle: `${course.title} (${course.institute?.name || "Institute"})`,
      details: {
        previousStatus,
        newStatus: status,
        rejectionNotes,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Course has been marked as ${status}`,
      course,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update course status", error: err.message });
  }
};

module.exports = {
  getAdminCourses,
  updateCourseStatus,
};
