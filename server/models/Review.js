const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    institute: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      default: "",
      trim: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["published", "flagged", "removed"],
      default: "published",
      index: true,
    },
  },
  { timestamps: true }
);

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
