const mongoose = require("mongoose");

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

const QUALIFICATION_OPTIONS = [
  "SSLC",
  "Higher Secondary (+2)",
  "Diploma",
  "ITI",
  "Undergraduate",
  "Postgraduate",
  "Other",
];

const studentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    gender: {
      type: String,
      enum: {
        values: GENDER_OPTIONS,
        message: "Invalid gender option",
      },
    },
    qualification: {
      type: String,
      enum: {
        values: QUALIFICATION_OPTIONS,
        message: "Invalid qualification option",
      },
    },
    role: {
      type: String,
      default: "student",
    },
    profileImage: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
module.exports.GENDER_OPTIONS = GENDER_OPTIONS;
module.exports.QUALIFICATION_OPTIONS = QUALIFICATION_OPTIONS;
