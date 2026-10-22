const express = require("express");
const router = express.Router();

const {
  createInstitute,
  loginInstitute,
  getInstituteProfile,
  updateInstituteProfile,
  getAllInstitutes,
  getInstituteById,
} = require("../controllers/instituteController");
const { verifyToken, requireRole } = require("../middleware/authMiddleware");

// Public endpoints
router.get("/", getAllInstitutes);
router.post("/", createInstitute);
router.post("/login", loginInstitute);

// Protected institute endpoints (must be before /:id)
router.get("/me/profile", verifyToken, requireRole("institute"), getInstituteProfile);
router.put("/me/profile", verifyToken, requireRole("institute"), updateInstituteProfile);

// Public single institute by ID
router.get("/:id", getInstituteById);

module.exports = router;
