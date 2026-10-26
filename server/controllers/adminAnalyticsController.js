const Student = require("../models/Student");
const Institute = require("../models/Institute");
const Application = require("../models/Application");
const Transaction = require("../models/Transaction");
const Course = require("../models/Course");

/**
 * Get aggregated analytics data for date ranges
 * GET /api/admin/analytics/summary
 */
const getAnalyticsSummary = async (req, res) => {
  try {
    const { range = "30d", startDate = "", endDate = "" } = req.query;

    const now = new Date();
    let fromDate = new Date();

    if (startDate && endDate) {
      fromDate = new Date(startDate);
      now.setTime(new Date(endDate).getTime());
      now.setHours(23, 59, 59, 999);
    } else if (range === "7d") {
      fromDate.setDate(now.getDate() - 7);
    } else if (range === "30d") {
      fromDate.setDate(now.getDate() - 30);
    } else if (range === "90d") {
      fromDate.setDate(now.getDate() - 90);
    } else if (range === "1y") {
      fromDate.setFullYear(now.getFullYear() - 1);
    } else {
      fromDate.setDate(now.getDate() - 30);
    }

    const dateFilter = { createdAt: { $gte: fromDate, $lte: now } };

    const [
      newStudents,
      newInstitutes,
      newApplications,
      acceptedApplications,
      revenueStats,
      dailyRegistrations,
      applicationsByStatus,
    ] = await Promise.all([
      Student.countDocuments(dateFilter),
      Institute.countDocuments(dateFilter),
      Application.countDocuments(dateFilter),
      Application.countDocuments({ ...dateFilter, status: "accepted" }),
      Transaction.aggregate([
        { $match: { ...dateFilter, status: "completed" } },
        { $group: { _id: null, totalRevenue: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      // Daily registrations trend
      Student.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            students: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Application.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const completedTransactionsCount = revenueStats[0]?.count || 0;

    return res.status(200).json({
      success: true,
      range,
      fromDate,
      toDate: now,
      summary: {
        newStudents,
        newInstitutes,
        newApplications,
        acceptedApplications,
        acceptanceRate: newApplications > 0 ? Math.round((acceptedApplications / newApplications) * 100) : 0,
        totalRevenue,
        completedTransactionsCount,
      },
      charts: {
        dailyRegistrations,
        applicationsByStatus,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to compile analytics report", error: err.message });
  }
};

/**
 * Generate CSV data export for administrative reports
 * GET /api/admin/analytics/export
 */
const exportReportCSV = async (req, res) => {
  try {
    const { type = "applications" } = req.query;

    let csvContent = "";
    let filename = `edufind-${type}-report-${Date.now()}.csv`;

    if (type === "applications") {
      const apps = await Application.find()
        .populate("institute", "name location")
        .sort({ createdAt: -1 })
        .limit(1000);

      csvContent = "Application ID,Student Name,Email,Phone,Institute,Course,Status,Date\n";
      apps.forEach((a) => {
        csvContent += `"${a._id}","${a.fullName || ""}","${a.email || ""}","${a.phone || ""}","${a.institute?.name || ""}","${a.course || ""}","${a.status}","${a.createdAt?.toISOString() || ""}"\n`;
      });
    } else if (type === "students") {
      const students = await Student.find().sort({ createdAt: -1 }).limit(1000);
      csvContent = "Student ID,Name,Email,Phone,Gender,Qualification,Status,Registration Date\n";
      students.forEach((s) => {
        csvContent += `"${s._id}","${s.name}","${s.email}","${s.phone}","${s.gender || ""}","${s.qualification || ""}","${s.isActive ? "active" : "suspended"}","${s.createdAt?.toISOString() || ""}"\n`;
      });
    } else if (type === "institutes") {
      const institutes = await Institute.find().sort({ createdAt: -1 }).limit(1000);
      csvContent = "Institute ID,Name,Contact Email,Phone,Location,Status,Verified,Featured,Fees,Registration Date\n";
      institutes.forEach((i) => {
        csvContent += `"${i._id}","${i.name}","${i.contactEmail}","${i.contactPhone}","${i.location}","${i.status || "pending"}","${Boolean(i.isVerified)}","${Boolean(i.isFeatured)}","${i.fees || 0}","${i.createdAt?.toISOString() || ""}"\n`;
      });
    } else if (type === "transactions") {
      const txs = await Transaction.find().sort({ createdAt: -1 }).limit(1000);
      csvContent = "Transaction ID,Order ID,Student Name,Institute Name,Amount,Currency,Status,Payment Method,Date\n";
      txs.forEach((t) => {
        csvContent += `"${t.transactionId}","${t.orderId || ""}","${t.studentName || ""}","${t.instituteName || ""}","${t.amount}","${t.currency}","${t.status}","${t.paymentMethod}","${t.createdAt?.toISOString() || ""}"\n`;
      });
    } else {
      return res.status(400).json({ message: "Invalid export type. Supported: applications, students, institutes, transactions" });
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csvContent);
  } catch (err) {
    return res.status(500).json({ message: "Failed to generate CSV export", error: err.message });
  }
};

module.exports = {
  getAnalyticsSummary,
  exportReportCSV,
};
