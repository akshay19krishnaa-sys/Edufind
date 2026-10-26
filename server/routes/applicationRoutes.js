const express = require("express");
const router = express.Router();

const {
  applyToInstitute,
  getMyApplications,
  checkApplicationStatus,
  getInstituteApplications,
  updateApplicationStatus,
} = require("../controllers/applicationController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

// Student routes
router.post("/", verifyToken, requireRole("student"), applyToInstitute);
router.get("/my", verifyToken, requireRole("student"), getMyApplications);
router.get("/check/:instituteId", verifyToken, requireRole("student"), checkApplicationStatus);

// Institute routes
router.get("/institute", verifyToken, requireRole("institute"), getInstituteApplications);
router.patch("/:id/status", verifyToken, requireRole("institute"), updateApplicationStatus);

module.exports = router;
