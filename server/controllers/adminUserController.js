const Student = require("../models/Student");
const Institute = require("../models/Institute");
const Application = require("../models/Application");
const Admin = require("../models/Admin");
const { recordAdminAudit } = require("../middleware/adminAuthMiddleware");

/**
 * List all users across the platform (Students and Institutes)
 * GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const { type = "all", status = "all", search = "", page = 1, limit = 15 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 15));
    const skip = (pageNum - 1) * limitNum;

    const searchRegex = search.trim() ? new RegExp(search.trim(), "i") : null;

    let users = [];
    let totalCount = 0;

    if (type === "student") {
      const query = {};
      if (searchRegex) {
        query.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
      }
      if (status === "active") query.isActive = true;
      if (status === "suspended") query.isActive = false;

      totalCount = await Student.countDocuments(query);
      const students = await Student.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      users = students.map((s) => ({
        id: s._id,
        _id: s._id,
        type: "student",
        name: s.name,
        email: s.email,
        phone: s.phone,
        status: s.isActive ? "active" : "suspended",
        isActive: s.isActive,
        qualification: s.qualification,
        createdAt: s.createdAt,
      }));
    } else if (type === "institute") {
      const query = {};
      if (searchRegex) {
        query.$or = [{ name: searchRegex }, { contactEmail: searchRegex }, { location: searchRegex }];
      }
      if (status === "active") query.isActive = true;
      if (status === "suspended") query.isActive = false;
      if (status === "pending") query.status = "pending";
      if (status === "verified") query.status = "verified";

      totalCount = await Institute.countDocuments(query);
      const institutes = await Institute.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);

      users = institutes.map((i) => ({
        id: i._id,
        _id: i._id,
        type: "institute",
        name: i.name,
        email: i.contactEmail,
        phone: i.contactPhone,
        status: i.status || (i.isVerified ? "verified" : "pending"),
        isActive: i.isActive !== false,
        isVerified: Boolean(i.isVerified),
        location: i.location,
        createdAt: i.createdAt,
      }));
    } else {
      // Combined students and institutes
      const studentQuery = {};
      const instituteQuery = {};

      if (searchRegex) {
        studentQuery.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
        instituteQuery.$or = [{ name: searchRegex }, { contactEmail: searchRegex }, { location: searchRegex }];
      }
      if (status === "active") {
        studentQuery.isActive = true;
        instituteQuery.isActive = true;
      }
      if (status === "suspended") {
        studentQuery.isActive = false;
        instituteQuery.isActive = false;
      }

      const [studentsCount, institutesCount] = await Promise.all([
        Student.countDocuments(studentQuery),
        Institute.countDocuments(instituteQuery),
      ]);
      totalCount = studentsCount + institutesCount;

      // Fetch sample of both
      const [students, institutes] = await Promise.all([
        Student.find(studentQuery).sort({ createdAt: -1 }).limit(limitNum),
        Institute.find(instituteQuery).sort({ createdAt: -1 }).limit(limitNum),
      ]);

      const mappedStudents = students.map((s) => ({
        id: s._id,
        _id: s._id,
        type: "student",
        name: s.name,
        email: s.email,
        phone: s.phone,
        status: s.isActive ? "active" : "suspended",
        isActive: s.isActive,
        qualification: s.qualification,
        createdAt: s.createdAt,
      }));

      const mappedInstitutes = institutes.map((i) => ({
        id: i._id,
        _id: i._id,
        type: "institute",
        name: i.name,
        email: i.contactEmail,
        phone: i.contactPhone,
        status: i.status || (i.isVerified ? "verified" : "pending"),
        isActive: i.isActive !== false,
        isVerified: Boolean(i.isVerified),
        location: i.location,
        createdAt: i.createdAt,
      }));

      const combined = [...mappedStudents, ...mappedInstitutes].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      users = combined.slice(0, limitNum);
    }

    return res.status(200).json({
      success: true,
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum) || 1,
      users,
    });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch users", error: err.message });
  }
};

/**
 * Get detailed profile and activity for a specific user
 * GET /api/admin/users/:id?type=student|institute
 */
const getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query;

    if (type === "student") {
      const student = await Student.findById(id);
      if (!student) return res.status(404).json({ message: "Student account not found" });

      const applications = await Application.find({ student: id })
        .populate("institute", "name location")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        user: student,
        type: "student",
        activity: {
          applicationsCount: applications.length,
          applications,
        },
      });
    }

    if (type === "institute") {
      const institute = await Institute.findById(id);
      if (!institute) return res.status(404).json({ message: "Institute account not found" });

      const applications = await Application.find({ institute: id })
        .populate("student", "name email phone")
        .sort({ createdAt: -1 });

      return res.status(200).json({
        success: true,
        user: institute,
        type: "institute",
        activity: {
          receivedApplicationsCount: applications.length,
          applications,
        },
      });
    }

    return res.status(400).json({ message: "Account type query parameter (student or institute) required" });
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch user details", error: err.message });
  }
};

/**
 * Safe Account Suspension / Activation with Audit Logging
 * PATCH /api/admin/users/:id/status
 */
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, action, reason = "" } = req.body;

    if (!type || !["student", "institute", "admin"].includes(type)) {
      return res.status(400).json({ message: "Valid user type (student, institute, admin) required" });
    }

    if (!action || !["suspend", "activate"].includes(action)) {
      return res.status(400).json({ message: "Action must be either 'suspend' or 'activate'" });
    }

    const shouldActivate = action === "activate";

    // Safety: prevent an admin from disabling their own account
    if (type === "admin") {
      if (String(id) === String(req.admin._id)) {
        return res.status(400).json({ message: "Security guard: You cannot suspend your own administrator account" });
      }
      const adminToUpdate = await Admin.findById(id);
      if (!adminToUpdate) return res.status(404).json({ message: "Admin not found" });
      adminToUpdate.isActive = shouldActivate;
      await adminToUpdate.save();

      await recordAdminAudit({
        admin: req.admin,
        action: shouldActivate ? "ADMIN_ACTIVATED" : "ADMIN_SUSPENDED",
        targetType: "Admin",
        targetId: adminToUpdate._id,
        targetTitle: adminToUpdate.name,
        details: { reason },
        req,
      });

      return res.status(200).json({
        success: true,
        message: `Admin account has been ${shouldActivate ? "activated" : "suspended"}`,
        status: shouldActivate ? "active" : "suspended",
      });
    }

    if (type === "student") {
      const student = await Student.findById(id);
      if (!student) return res.status(404).json({ message: "Student account not found" });

      student.isActive = shouldActivate;
      student.status = shouldActivate ? "active" : "suspended";
      student.suspensionReason = shouldActivate ? "" : reason;
      await student.save();

      await recordAdminAudit({
        admin: req.admin,
        action: shouldActivate ? "STUDENT_ACTIVATED" : "STUDENT_SUSPENDED",
        targetType: "Student",
        targetId: student._id,
        targetTitle: student.name,
        details: { email: student.email, reason },
        req,
      });

      return res.status(200).json({
        success: true,
        message: `Student account has been ${shouldActivate ? "activated" : "suspended"}`,
        status: student.status,
      });
    }

    if (type === "institute") {
      const institute = await Institute.findById(id);
      if (!institute) return res.status(404).json({ message: "Institute account not found" });

      institute.isActive = shouldActivate;
      institute.status = shouldActivate ? (institute.isVerified ? "verified" : "pending") : "suspended";
      if (!shouldActivate && reason) {
        institute.reviewNotes = reason;
      }
      await institute.save();

      await recordAdminAudit({
        admin: req.admin,
        action: shouldActivate ? "INSTITUTE_ACTIVATED" : "INSTITUTE_SUSPENDED",
        targetType: "Institute",
        targetId: institute._id,
        targetTitle: institute.name,
        details: { email: institute.contactEmail, reason },
        req,
      });

      return res.status(200).json({
        success: true,
        message: `Institute account has been ${shouldActivate ? "activated" : "suspended"}`,
        status: institute.status,
      });
    }
  } catch (err) {
    return res.status(500).json({ message: "Failed to update user status", error: err.message });
  }
};

module.exports = {
  getUsers,
  getUserDetails,
  toggleUserStatus,
};
