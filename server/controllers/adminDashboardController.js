const Student = require("../models/Student");
const Institute = require("../models/Institute");
const Application = require("../models/Application");
const Course = require("../models/Course");
const Transaction = require("../models/Transaction");
const Report = require("../models/Report");

/**
 * Get Comprehensive Live Platform Metrics
 * GET /api/admin/dashboard/metrics
 */
const getDashboardMetrics = async (req, res) => {
  try {
    // 1. Students metrics
    const [totalStudents, activeStudents, suspendedStudents] = await Promise.all([
      Student.countDocuments(),
      Student.countDocuments({ $or: [{ isActive: true }, { status: "active" }] }),
      Student.countDocuments({ $or: [{ isActive: false }, { status: "suspended" }] }),
    ]);

    // 2. Institutes metrics
    const [
      totalInstitutes,
      verifiedInstitutes,
      pendingInstitutes,
      rejectedInstitutes,
      suspendedInstitutes,
      featuredInstitutes,
    ] = await Promise.all([
      Institute.countDocuments(),
      Institute.countDocuments({ isVerified: true, status: { $ne: "suspended" } }),
      Institute.countDocuments({ status: "pending", isVerified: { $ne: true } }),
      Institute.countDocuments({ status: "rejected" }),
      Institute.countDocuments({ status: "suspended" }),
      Institute.countDocuments({ isFeatured: true }),
    ]);

    // 3. Courses metrics
    const [totalCourses, publishedCourses, pendingCourses] = await Promise.all([
      Course.countDocuments(),
      Course.countDocuments({ status: "published" }),
      Course.countDocuments({ status: "pending" }),
    ]);

    // 4. Applications metrics
    const [
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
    ] = await Promise.all([
      Application.countDocuments(),
      Application.countDocuments({ status: "pending" }),
      Application.countDocuments({ status: "accepted" }),
      Application.countDocuments({ status: "rejected" }),
    ]);

    // 5. Transactions & Revenue metrics (based on real MongoDB records)
    const [
      totalTransactions,
      completedTransactions,
      pendingTransactions,
      failedTransactions,
      refundedTransactions,
      revenueResult,
    ] = await Promise.all([
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: "completed" }),
      Transaction.countDocuments({ status: "pending" }),
      Transaction.countDocuments({ status: "failed" }),
      Transaction.countDocuments({ status: "refunded" }),
      Transaction.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const verifiedRevenue = revenueResult[0]?.total || 0;

    // 6. Moderation Queue
    const pendingReports = await Report.countDocuments({ status: "pending" });
    const pendingModerationItems = pendingReports + pendingInstitutes;

    // 7. Recent Activity feeds
    const recentStudents = await Student.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email phone createdAt");

    const recentInstitutes = await Institute.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name contactEmail location status isVerified createdAt");

    const recentApplications = await Application.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("institute", "name location")
      .populate("student", "name email");

    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      metrics: {
        students: {
          total: totalStudents,
          active: activeStudents,
          suspended: suspendedStudents,
        },
        institutes: {
          total: totalInstitutes,
          verified: verifiedInstitutes,
          pending: pendingInstitutes,
          rejected: rejectedInstitutes,
          suspended: suspendedInstitutes,
          featured: featuredInstitutes,
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          pending: pendingCourses,
        },
        applications: {
          total: totalApplications,
          pending: pendingApplications,
          accepted: acceptedApplications,
          rejected: rejectedApplications,
        },
        financials: {
          totalTransactions,
          completed: completedTransactions,
          pending: pendingTransactions,
          failed: failedTransactions,
          refunded: refundedTransactions,
          verifiedRevenue,
        },
        moderation: {
          pendingReports,
          pendingInstitutes,
          totalPending: pendingModerationItems,
        },
      },
      recentActivity: {
        students: recentStudents,
        institutes: recentInstitutes,
        applications: recentApplications,
        transactions: recentTransactions,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to aggregate dashboard metrics", error: err.message });
  }
};

module.exports = {
  getDashboardMetrics,
};
