const mongoose = require("mongoose");
const Application = require("../models/Application");
const Institute = require("../models/Institute");
const Student = require("../models/Student");

/**
 * Submit a new admission application (Student only)
 * POST /api/applications
 */
const applyToInstitute = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { instituteId, course, statement } = req.body;

    if (!instituteId) {
      return res.status(400).json({ message: "Institute ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(instituteId)) {
      return res.status(400).json({ message: "Invalid institute ID" });
    }

    // Verify student exists and is active
    const student = await Student.findById(studentId);
    if (!student || !student.isActive) {
      return res.status(404).json({ message: "Student account not found or deactivated" });
    }

    // Verify target institute exists
    const institute = await Institute.findById(instituteId);
    if (!institute) {
      return res.status(404).json({ message: "Institute not found" });
    }

    // Check for duplicate application
    const existingApplication = await Application.findOne({
      student: studentId,
      institute: instituteId,
    });

    if (existingApplication) {
      return res.status(409).json({
        message: "You have already submitted an application to this institute",
        application: existingApplication,
      });
    }

    // Determine course selection
    let selectedCourse = "General Admission";
    if (course && String(course).trim()) {
      selectedCourse = String(course).trim();
    } else if (Array.isArray(institute.courses) && institute.courses.length > 0) {
      selectedCourse = institute.courses[0];
    }

    const applicationPayload = {
      student: student._id,
      institute: institute._id,
      course: selectedCourse,
      status: "pending",
      fullName: student.name,
      email: student.email,
      phone: student.phone,
      qualification: student.qualification || "",
      statement: statement ? String(statement).trim() : "",
    };

    const application = await Application.create(applicationPayload);
    await application.populate(
      "institute",
      "name location image contactEmail contactPhone courses fees duration isVerified"
    );

    return res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "You have already submitted an application to this institute",
      });
    }

    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0];
      return res.status(400).json({
        message: firstError?.message || "Validation failed",
      });
    }

    return res.status(500).json({
      message: "Failed to submit application",
      error: error.message,
    });
  }
};

/**
 * Get all applications submitted by the logged-in student (Student only)
 * GET /api/applications/my
 */
const getMyApplications = async (req, res) => {
  try {
    const studentId = req.user.id;

    const applications = await Application.find({ student: studentId })
      .populate(
        "institute",
        "name location image contactEmail contactPhone courses fees duration isVerified"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: applications.length,
      applications,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch student applications",
      error: error.message,
    });
  }
};

/**
 * Check if the student has applied to a specific institute
 * GET /api/applications/check/:instituteId
 */
const checkApplicationStatus = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { instituteId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(instituteId)) {
      return res.status(400).json({ message: "Invalid institute ID" });
    }

    const application = await Application.findOne({
      student: studentId,
      institute: instituteId,
    }).populate(
      "institute",
      "name location image contactEmail contactPhone courses fees duration isVerified"
    );

    return res.status(200).json({
      hasApplied: Boolean(application),
      application: application || null,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to check application status",
      error: error.message,
    });
  }
};

/**
 * Get all applications received by the logged-in institute (Institute only)
 * GET /api/applications/institute
 */
const getInstituteApplications = async (req, res) => {
  try {
    const instituteId = req.user.id;

    const applications = await Application.find({ institute: instituteId })
      .populate("student", "name email phone gender qualification profileImage")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: applications.length,
      applications,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch institute applications",
      error: error.message,
    });
  }
};

/**
 * Accept or Reject an application (Institute only)
 * PATCH /api/applications/:id/status
 */
const updateApplicationStatus = async (req, res) => {
  try {
    const instituteId = req.user.id;
    const { id } = req.params;
    const { status, decisionNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid application ID" });
    }

    if (!status || !["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Status must be either 'accepted' or 'rejected'",
      });
    }

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Security check: strictly verify this application belongs to the authenticated institute
    if (application.institute.toString() !== instituteId.toString()) {
      return res.status(403).json({
        message: "Forbidden: You cannot modify applications belonging to another institute",
      });
    }

    application.status = status;
    application.decisionDate = new Date();
    if (decisionNotes !== undefined) {
      application.decisionNotes = String(decisionNotes).trim();
    }

    await application.save();
    await application.populate(
      "student",
      "name email phone gender qualification profileImage"
    );

    return res.status(200).json({
      message: `Application has been ${status}`,
      application,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update application status",
      error: error.message,
    });
  }
};

module.exports = {
  applyToInstitute,
  getMyApplications,
  checkApplicationStatus,
  getInstituteApplications,
  updateApplicationStatus,
};
