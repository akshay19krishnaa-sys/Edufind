const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Institute = require("../models/Institute");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s-]{7,18}\d$/;

/**
 * Remove sensitive credentials from institute object before sending response
 */
const sanitizeInstitute = (inst) => {
  if (!inst) return null;
  const data = inst.toObject ? inst.toObject() : { ...inst };
  delete data.password;
  return data;
};

// Add / Register a new institute
const createInstitute = async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      courses,
      fees,
      duration,
      contactEmail,
      contactPhone,
      password,
      image,
    } = req.body;

    // --- Required field validation ---
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: "Institute name is required" });
    }

    if (!description || !String(description).trim()) {
      return res.status(400).json({ message: "Institute description is required" });
    }

    if (!location || !String(location).trim()) {
      return res.status(400).json({ message: "Location is required" });
    }

    if (fees === undefined || fees === null || fees === "") {
      return res.status(400).json({ message: "Course fees are required" });
    }

    const parsedFees = Number(fees);
    if (isNaN(parsedFees) || parsedFees < 0) {
      return res
        .status(400)
        .json({ message: "Fees must be a non-negative number" });
    }

    if (!duration || !String(duration).trim()) {
      return res.status(400).json({ message: "Course duration is required" });
    }

    if (!contactEmail || !String(contactEmail).trim()) {
      return res.status(400).json({ message: "Contact email is required" });
    }

    const normalizedEmail = String(contactEmail).trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res
        .status(400)
        .json({ message: "Please enter a valid contact email address" });
    }

    if (!contactPhone || !String(contactPhone).trim()) {
      return res.status(400).json({ message: "Contact phone number is required" });
    }

    if (!PHONE_REGEX.test(String(contactPhone).trim())) {
      return res
        .status(400)
        .json({ message: "Please enter a valid contact phone number" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // --- Duplicate email check ---
    const existing = await Institute.findOne({
      contactEmail: normalizedEmail,
    });

    if (existing) {
      return res.status(409).json({
        message: "An institute with this contact email is already registered",
      });
    }

    // --- Sanitise courses ---
    let sanitisedCourses = [];
    if (Array.isArray(courses)) {
      sanitisedCourses = courses
        .map((c) => String(c).trim())
        .filter((c) => c.length > 0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(String(password), 10);

    // --- Build payload — force isVerified: false, never trust client ---
    const payload = {
      name: String(name).trim(),
      description: String(description).trim(),
      location: String(location).trim(),
      courses: sanitisedCourses,
      fees: parsedFees,
      duration: String(duration).trim(),
      contactEmail: normalizedEmail,
      contactPhone: String(contactPhone).trim(),
      password: hashedPassword,
      role: "institute",
      isVerified: false, // always false on public creation
    };

    if (image && String(image).trim()) {
      payload.image = String(image).trim();
    }

    const institute = await Institute.create(payload);

    return res.status(201).json({
      message: "Institute registered successfully",
      institute: sanitizeInstitute(institute),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An institute with this contact email is already registered",
      });
    }

    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0];
      return res.status(400).json({
        message: firstError?.message || "Validation failed",
      });
    }

    return res.status(500).json({
      message: "Failed to register institute",
      error: error.message,
    });
  }
};

// Institute Login
const loginInstitute = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Query institute with password field included explicitly
    const institute = await Institute.findOne({
      contactEmail: normalizedEmail,
    }).select("+password");

    // Generic error to avoid account enumeration
    if (!institute || !institute.password) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(String(password), institute.password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Server authentication configuration error",
      });
    }

    const token = jwt.sign(
      {
        id: institute._id,
        role: institute.role || "institute",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      institute: sanitizeInstitute(institute),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to login",
      error: error.message,
    });
  }
};

// Get profile of authenticated institute
const getInstituteProfile = async (req, res) => {
  try {
    const institute = await Institute.findById(req.user.id);
    if (!institute) {
      return res.status(404).json({ message: "Institute not found" });
    }

    return res.status(200).json({
      institute: sanitizeInstitute(institute),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch institute profile",
      error: error.message,
    });
  }
};

// Update profile of authenticated institute
const updateInstituteProfile = async (req, res) => {
  try {
    const institute = await Institute.findById(req.user.id);
    if (!institute) {
      return res.status(404).json({ message: "Institute not found" });
    }

    const {
      name,
      description,
      location,
      courses,
      fees,
      duration,
      contactPhone,
      image,
    } = req.body;

    // Disallow touching isVerified, role, password, _id or contactEmail via this endpoint
    if (name && String(name).trim()) institute.name = String(name).trim();
    if (description && String(description).trim()) institute.description = String(description).trim();
    if (location && String(location).trim()) institute.location = String(location).trim();
    if (duration && String(duration).trim()) institute.duration = String(duration).trim();
    if (contactPhone && String(contactPhone).trim()) institute.contactPhone = String(contactPhone).trim();
    if (image !== undefined) institute.image = String(image || "").trim();

    if (fees !== undefined && fees !== null && fees !== "") {
      const parsed = Number(fees);
      if (!isNaN(parsed) && parsed >= 0) {
        institute.fees = parsed;
      }
    }

    if (Array.isArray(courses)) {
      institute.courses = courses
        .map((c) => String(c).trim())
        .filter((c) => c.length > 0);
    }

    // Security: never allow updating isVerified or role from this endpoint
    // institute.isVerified and institute.role remain unchanged

    await institute.save();

    return res.status(200).json({
      message: "Profile updated successfully",
      institute: sanitizeInstitute(institute),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update institute profile",
      error: error.message,
    });
  }
};

// Get all institutes (Public)
const getAllInstitutes = async (req, res) => {
  try {
    const institutes = await Institute.find().sort({ createdAt: -1 });

    res.status(200).json({
      count: institutes.length,
      institutes,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch institutes",
      error: error.message,
    });
  }
};

// Get one institute by ID (Public)
const getInstituteById = async (req, res) => {
  try {
    const institute = await Institute.findById(req.params.id);

    if (!institute) {
      return res.status(404).json({
        message: "Institute not found",
      });
    }

    res.status(200).json({ institute });
  } catch (error) {
    res.status(400).json({
      message: "Invalid institute ID",
      error: error.message,
    });
  }
};

module.exports = {
  createInstitute,
  loginInstitute,
  getInstituteProfile,
  updateInstituteProfile,
  getAllInstitutes,
  getInstituteById,
  sanitizeInstitute,
};
