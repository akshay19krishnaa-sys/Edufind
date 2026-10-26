const Institute = require("../models/Institute");
const Application = require("../models/Application");
const Course = require("../models/Course");
const { recordAdminAudit } = require("../middleware/adminAuthMiddleware");

/**
 * List institutes with filtering, search and pagination
 * GET /api/admin/institutes
 */
const getAdminInstitutes = async (req, res) => {
  try {
    const { status = "all", search = "", page = 1, limit = 15 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (status === "pending") {
      query.status = "pending";
      query.isVerified = { $ne: true };
    } else if (status === "verified") {
      query.$or = [{ status: "verified" }, { isVerified: true }];
      query.status = { $ne: "suspended" };
    } else if (status === "rejected") {
      query.status = "rejected";
    } else if (status === "suspended") {
      query.status = "suspended";
    } else if (status === "featured") {
      query.isFeatured = true;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ name: regex }, { contactEmail: regex }, { location: regex }];
    }

    const totalCount = await Institute.countDocuments(query);
    const institutes = await Institute.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    return res.status(200).json({
      success: true,
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      institutes,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch institutes", error: err.message });
  }
};

/**
 * Get complete institute profile and related stats
 * GET /api/admin/institutes/:id
 */
const getAdminInstituteById = async (req, res) => {
  try {
    const { id } = req.params;
    const institute = await Institute.findById(id);

    if (!institute) {
      return res.status(404).json({ message: "Institute not found" });
    }

    const [applicationsCount, coursesCount] = await Promise.all([
      Application.countDocuments({ institute: id }),
      Course.countDocuments({ institute: id }),
    ]);

    return res.status(200).json({
      success: true,
      institute,
      stats: {
        applicationsCount,
        coursesCount,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to load institute details", error: err.message });
  }
};

/**
 * Approve, Reject, or Update Verification Status
 * PATCH /api/admin/institutes/:id/verification
 */
const updateInstituteVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes = "", rejectionReason = "" } = req.body;

    if (!status || !["verified", "rejected", "pending", "suspended"].includes(status)) {
      return res.status(400).json({ message: "Valid status (verified, rejected, pending, suspended) is required" });
    }

    const institute = await Institute.findById(id);
    if (!institute) {
      return res.status(404).json({ message: "Institute not found" });
    }

    const previousStatus = institute.status || (institute.isVerified ? "verified" : "pending");

    institute.status = status;
    institute.isVerified = status === "verified";
    institute.isActive = status !== "suspended";

    if (reviewNotes) institute.reviewNotes = String(reviewNotes).trim();
    if (rejectionReason) institute.rejectionReason = String(rejectionReason).trim();

    await institute.save();

    // If verified, update any unpublished baseline courses
    if (status === "verified") {
      await Course.updateMany({ institute: id, status: "pending" }, { status: "published" });
    }

    await recordAdminAudit({
      admin: req.admin,
      action: `INSTITUTE_${status.toUpperCase()}`,
      targetType: "Institute",
      targetId: institute._id,
      targetTitle: institute.name,
      details: {
        previousStatus,
        newStatus: status,
        reviewNotes,
        rejectionReason,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: `Institute has been marked as ${status}`,
      institute,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update verification status", error: err.message });
  }
};

/**
 * Toggle Featured Status for an Institute (Module 7)
 * PATCH /api/admin/institutes/:id/featured
 */
const toggleInstituteFeatured = async (req, res) => {
  try {
    const { id } = req.params;
    const { isFeatured, priority = 0, featuredUntil = null } = req.body;

    const institute = await Institute.findById(id);
    if (!institute) {
      return res.status(404).json({ message: "Institute not found" });
    }

    // Security & Business Rule: Only verified, active institutes may be featured
    if (isFeatured && (!institute.isVerified || institute.status === "suspended")) {
      return res.status(400).json({
        message: "Only verified, non-suspended partner institutes are eligible to be featured",
      });
    }

    institute.isFeatured = Boolean(isFeatured);
    institute.featuredPriority = parseInt(priority, 10) || 0;
    if (featuredUntil) {
      institute.featuredUntil = new Date(featuredUntil);
    } else {
      institute.featuredUntil = null;
    }

    await institute.save();

    await recordAdminAudit({
      admin: req.admin,
      action: isFeatured ? "INSTITUTE_FEATURED" : "INSTITUTE_UNFEATURED",
      targetType: "Institute",
      targetId: institute._id,
      targetTitle: institute.name,
      details: {
        isFeatured,
        priority,
        featuredUntil,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: isFeatured ? "Institute featured successfully" : "Institute removed from featured list",
      institute,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to update featured status", error: err.message });
  }
};

module.exports = {
  getAdminInstitutes,
  getAdminInstituteById,
  updateInstituteVerification,
  toggleInstituteFeatured,
};
