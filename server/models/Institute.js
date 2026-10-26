const mongoose = require("mongoose");

const INSTITUTE_STATUSES = ["pending", "verified", "rejected", "suspended"];

const instituteSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    courses: [
      {
        type: String,
        trim: true,
      },
    ],
    fees: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: String,
      required: true,
    },
    contactEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      default: "institute",
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    status: {
      type: String,
      enum: INSTITUTE_STATUSES,
      default: "pending",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    rejectionReason: {
      type: String,
      default: "",
    },
    reviewNotes: {
      type: String,
      default: "",
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    featuredPriority: {
      type: Number,
      default: 0,
    },
    featuredUntil: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Pre-save hook to ensure status & isVerified stay synchronized
instituteSchema.pre("save", function () {
  if (this.isModified("status")) {
    if (this.status === "verified") {
      this.isVerified = true;
      this.isActive = true;
    } else if (this.status === "suspended") {
      this.isActive = false;
    } else if (this.status === "rejected") {
      this.isVerified = false;
    } else if (this.status === "pending") {
      this.isVerified = false;
    }
  } else if (this.isModified("isVerified")) {
    if (this.isVerified && this.status === "pending") {
      this.status = "verified";
    }
  }
});

const Institute = mongoose.model("Institute", instituteSchema);

module.exports = Institute;
module.exports.INSTITUTE_STATUSES = INSTITUTE_STATUSES;
