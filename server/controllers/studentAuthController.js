const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const { GENDER_OPTIONS, QUALIFICATION_OPTIONS } = Student;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s-]{7,18}\d$/;

const sanitizeStudent = (student) => {
  const data = student.toObject ? student.toObject() : { ...student };
  delete data.password;
  return data;
};

const createToken = (student) => {
  if (!process.env.JWT_SECRET) {
    return null;
  }

  return jwt.sign(
    {
      id: student._id,
      role: student.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const registerStudent = async (req, res) => {
  try {
    const { name, email, phone, password, gender, qualification } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Full name is required" });
    }

    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: "Email address is required" });
    }

    if (!EMAIL_REGEX.test(String(email).trim())) {
      return res.status(400).json({ message: "Please enter a valid email address" });
    }

    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const normalizedPhone = String(phone).trim();
    if (!PHONE_REGEX.test(normalizedPhone)) {
      return res.status(400).json({
        message: "Please enter a valid phone number",
      });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    if (gender !== undefined && gender !== null && gender !== "") {
      if (!GENDER_OPTIONS.includes(gender)) {
        return res.status(400).json({ message: "Invalid gender option" });
      }
    }

    if (
      qualification !== undefined &&
      qualification !== null &&
      qualification !== ""
    ) {
      if (!QUALIFICATION_OPTIONS.includes(qualification)) {
        return res.status(400).json({ message: "Invalid qualification option" });
      }
    }

    const existingStudent = await Student.findOne({
      email: String(email).trim().toLowerCase(),
    });

    if (existingStudent) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const studentPayload = {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: normalizedPhone,
      password: hashedPassword,
      role: "student",
    };

    if (gender) {
      studentPayload.gender = gender;
    }

    if (qualification) {
      studentPayload.qualification = qualification;
    }

    const student = await Student.create(studentPayload);
    const token = createToken(student);

    return res.status(201).json({
      message: "Student registered successfully",
      student: sanitizeStudent(student),
      ...(token ? { token } : {}),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists",
      });
    }

    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0];
      return res.status(400).json({
        message: firstError?.message || "Validation failed",
      });
    }

    return res.status(500).json({
      message: "Failed to register student",
      error: error.message,
    });
  }
};

const loginStudent = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const student = await Student.findOne({
      email: String(email).trim().toLowerCase(),
    }).select("+password");

    if (!student) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!student.isActive) {
      return res.status(403).json({
        message: "This account has been deactivated",
      });
    }

    const isMatch = await bcrypt.compare(String(password), student.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = createToken(student);

    return res.status(200).json({
      message: "Login successful",
      student: sanitizeStudent(student),
      ...(token ? { token } : {}),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to login",
      error: error.message,
    });
  }
};

module.exports = {
  registerStudent,
  loginStudent,
};
