const AuditLog = require("../models/AuditLog");

/**
 * List audit log records with filtering and pagination
 * GET /api/admin/audit-logs
 */
const getAuditLogs = async (req, res) => {
  try {
    const { action = "all", targetType = "all", search = "", page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (action !== "all") {
      query.action = action;
    }

    if (targetType !== "all") {
      query.targetType = targetType;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ adminEmail: regex }, { action: regex }, { targetTitle: regex }];
    }

    const [totalCount, logs] = await Promise.all([
      AuditLog.countDocuments(query),
      AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    ]);

    return res.status(200).json({
      success: true,
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      logs,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch audit logs", error: err.message });
  }
};

module.exports = {
  getAuditLogs,
};
