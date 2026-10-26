const mongoose = require("mongoose");

const COURSE_STATUSES = ["published", "pending", "rejected", "hidden"];

const courseSchema = new mongoose.Schema(
  {
    institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "General",
      trim: true,
    },
    fees: {
      type: Number,
      default: 0,
      min: 0,
    },
    duration: {
      type: String,
      default: "Self-paced",
      trim: true,
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
      default: "All Levels",
    },
    status: {
      type: String,
      enum: COURSE_STATUSES,
      default: "published",
      index: true,
    },
    rejectionNotes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
module.exports.COURSE_STATUSES = COURSE_STATUSES;
