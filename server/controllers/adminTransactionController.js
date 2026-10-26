const Transaction = require("../models/Transaction");
const { recordAdminAudit } = require("../middleware/adminAuthMiddleware");

/**
 * List all transactions with status and search filters
 * GET /api/admin/transactions
 */
const getAdminTransactions = async (req, res) => {
  try {
    const { status = "all", search = "", startDate = "", endDate = "", page = 1, limit = 15 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (status !== "all") {
      query.status = status;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ transactionId: regex }, { orderId: regex }, { studentName: regex }, { instituteName: regex }];
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

    const [totalCount, transactions, statusCounts, revenueResult] = await Promise.all([
      Transaction.countDocuments(query),
      Transaction.find(query)
        .populate("student", "name email phone")
        .populate("institute", "name location")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Transaction.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const stats = {
      total: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      refunded: 0,
      verifiedRevenue: revenueResult[0]?.total || 0,
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
      transactions,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch transactions", error: err.message });
  }
};

/**
 * Record a verified refund action on a transaction
 * PATCH /api/admin/transactions/:id/refund
 */
const recordTransactionRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { refundReason = "Customer requested refund", refundAmount } = req.body;

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction record not found" });
    }

    if (transaction.status !== "completed") {
      return res.status(400).json({ message: `Cannot refund a transaction with status "${transaction.status}"` });
    }

    transaction.status = "refunded";
    transaction.refundDetails = {
      refundedAt: new Date(),
      refundReason,
      refundAmount: refundAmount || transaction.amount,
      refundedBy: req.admin.email,
    };

    await transaction.save();

    await recordAdminAudit({
      admin: req.admin,
      action: "TRANSACTION_REFUNDED",
      targetType: "Transaction",
      targetId: transaction._id,
      targetTitle: transaction.transactionId,
      details: {
        amount: transaction.amount,
        refundReason,
      },
      req,
    });

    return res.status(200).json({
      success: true,
      message: "Transaction refund recorded successfully",
      transaction,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to record refund", error: err.message });
  }
};

module.exports = {
  getAdminTransactions,
  recordTransactionRefund,
};
