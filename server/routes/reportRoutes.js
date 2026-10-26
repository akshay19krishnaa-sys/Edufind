const express = require("express");
const router = express.Router();
const { submitReport } = require("../controllers/adminModerationController");

// Public/student endpoint to submit content reports
router.post("/", submitReport);

module.exports = router;
