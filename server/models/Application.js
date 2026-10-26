const mongoose = require("mongoose");

const APPLICATION_STATUSES = ["pending", "accepted", "rejected"];

const applicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: [true, "Student reference is required"],
      index: true,
    },
    institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: [true, "Institute reference is required"],
      index: true,
    },
    course: {
      type: String,
      trim: true,
      default: "General Admission",
    },
    status: {
      type: String,
      enum: {
        values: APPLICATION_STATUSES,
        message: "Status must be pending, accepted, or rejected",
      },
      default: "pending",
      index: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    qualification: {
      type: String,
      trim: true,
    },
    statement: {
      type: String,
      trim: true,
      default: "",
    },
    decisionNotes: {
      type: String,
      trim: true,
      default: "",
    },
    decisionDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound unique index to strictly prevent duplicate applications by the same student to the same institute
applicationSchema.index({ student: 1, institute: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
module.exports.APPLICATION_STATUSES = APPLICATION_STATUSES;
