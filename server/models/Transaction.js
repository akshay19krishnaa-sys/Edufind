const mongoose = require("mongoose");

const TRANSACTION_STATUSES = ["completed", "pending", "failed", "refunded"];

const transactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    orderId: {
      type: String,
      default: "",
      trim: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: false,
      index: true,
    },
    institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: false,
      index: true,
    },
    studentName: {
      type: String,
      default: "",
    },
    instituteName: {
      type: String,
      default: "",
    },
    purpose: {
      type: String,
      default: "Admission Fee",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    paymentMethod: {
      type: String,
      default: "UPI / Card",
    },
    paymentGateway: {
      type: String,
      default: "Razorpay",
    },
    status: {
      type: String,
      enum: TRANSACTION_STATUSES,
      default: "pending",
      index: true,
    },
    refundDetails: {
      refundedAt: Date,
      refundReason: String,
      refundAmount: Number,
      refundedBy: String,
    },
  },
  { timestamps: true }
);

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
module.exports.TRANSACTION_STATUSES = TRANSACTION_STATUSES;
