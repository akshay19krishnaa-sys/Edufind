const express = require("express");
const router = express.Router();

const { verifyAdminToken } = require("../middleware/adminAuthMiddleware");

// Controllers
const {
  loginAdmin,
  getAdminProfile,
  updateAdminPassword,
} = require("../controllers/adminAuthController");

const {
  getDashboardMetrics,
} = require("../controllers/adminDashboardController");

const {
  getUsers,
  getUserDetails,
  toggleUserStatus,
} = require("../controllers/adminUserController");

const {
  getAdminInstitutes,
  getAdminInstituteById,
  updateInstituteVerification,
  toggleInstituteFeatured,
} = require("../controllers/adminInstituteController");

const {
  getAdminApplications,
  getAdminApplicationDetails,
  overrideApplicationStatus,
} = require("../controllers/adminApplicationController");

const {
  getAdminCourses,
  updateCourseStatus,
} = require("../controllers/adminCourseController");

const {
  getModerationReports,
  resolveModerationReport,
} = require("../controllers/adminModerationController");

const {
  getAdminTransactions,
  recordTransactionRefund,
} = require("../controllers/adminTransactionController");

const {
  getAnalyticsSummary,
  exportReportCSV,
} = require("../controllers/adminAnalyticsController");

const {
  getPlatformSettings,
  updatePlatformSettings,
} = require("../controllers/adminSettingsController");

const {
  getAuditLogs,
} = require("../controllers/adminAuditController");

// ─── Authentication ──────────────────────────────────────────────────────────
router.post("/auth/login", loginAdmin);
router.get("/auth/me", verifyAdminToken, getAdminProfile);
router.put("/auth/password", verifyAdminToken, updateAdminPassword);

// ─── Module 1: Dashboard Overview ───────────────────────────────────────────
router.get("/dashboard/metrics", verifyAdminToken, getDashboardMetrics);

// ─── Module 2: Users Management ─────────────────────────────────────────────
router.get("/users", verifyAdminToken, getUsers);
router.get("/users/:id", verifyAdminToken, getUserDetails);
router.patch("/users/:id/status", verifyAdminToken, toggleUserStatus);

// ─── Module 3 & 7: Institute Management, Verification & Featured ─────────────
router.get("/institutes", verifyAdminToken, getAdminInstitutes);
router.get("/institutes/:id", verifyAdminToken, getAdminInstituteById);
router.patch("/institutes/:id/verification", verifyAdminToken, updateInstituteVerification);
router.patch("/institutes/:id/featured", verifyAdminToken, toggleInstituteFeatured);

// ─── Module 5: Application Monitoring ───────────────────────────────────────
router.get("/applications", verifyAdminToken, getAdminApplications);
router.get("/applications/:id", verifyAdminToken, getAdminApplicationDetails);
router.patch("/applications/:id/override", verifyAdminToken, overrideApplicationStatus);

// ─── Module 10: Course Moderation ───────────────────────────────────────────
router.get("/courses", verifyAdminToken, getAdminCourses);
router.patch("/courses/:id/status", verifyAdminToken, updateCourseStatus);

// ─── Module 4: Reviews & Reported Content Moderation ────────────────────────
router.get("/moderation/reports", verifyAdminToken, getModerationReports);
router.patch("/moderation/reports/:id", verifyAdminToken, resolveModerationReport);

// ─── Module 6: Transaction Monitoring ───────────────────────────────────────
router.get("/transactions", verifyAdminToken, getAdminTransactions);
router.patch("/transactions/:id/refund", verifyAdminToken, recordTransactionRefund);

// ─── Module 8: Reports & Analytics ──────────────────────────────────────────
router.get("/analytics/summary", verifyAdminToken, getAnalyticsSummary);
router.get("/analytics/export", verifyAdminToken, exportReportCSV);

// ─── Module 9: Platform Settings ────────────────────────────────────────────
router.get("/settings", verifyAdminToken, getPlatformSettings);
router.put("/settings", verifyAdminToken, updatePlatformSettings);

// ─── Module 11: Admin Audit Logs ────────────────────────────────────────────
router.get("/audit-logs", verifyAdminToken, getAuditLogs);

module.exports = router;
