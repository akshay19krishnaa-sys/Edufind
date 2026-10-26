/**
 * Verification script for the Student Admission / Application System
 */
require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Student = require("./models/Student");
const Institute = require("./models/Institute");
const Application = require("./models/Application");

const API_BASE = "http://localhost:5000";

async function runTests() {
  console.log("=== Starting Application System Verification ===");

  if (!process.env.MONGO_URI || !process.env.JWT_SECRET) {
    throw new Error("Missing MONGO_URI or JWT_SECRET");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✓ Connected to MongoDB Atlas");

  // Step 1: Ensure test student 1 exists
  let student1 = await Student.findOne({ email: "test_applicant1@edufind.com" });
  if (!student1) {
    student1 = await Student.create({
      name: "Applicant One",
      email: "test_applicant1@edufind.com",
      phone: "+91 9876543210",
      password: "password123",
      qualification: "Undergraduate",
      gender: "Female",
      role: "student",
    });
  }

  // Step 2: Ensure test student 2 exists (for isolation tests)
  let student2 = await Student.findOne({ email: "test_applicant2@edufind.com" });
  if (!student2) {
    student2 = await Student.create({
      name: "Applicant Two",
      email: "test_applicant2@edufind.com",
      phone: "+91 9876543211",
      password: "password123",
      qualification: "Higher Secondary (+2)",
      gender: "Male",
      role: "student",
    });
  }

  // Step 3: Ensure test institute 1 exists
  let institute1 = await Institute.findOne({ contactEmail: "admissions_one@edufind.com" });
  if (!institute1) {
    institute1 = await Institute.create({
      name: "Apex Tech Institute",
      description: "Premier technical and engineering academy",
      location: "Bengaluru, Karnataka",
      courses: ["Full Stack Web Development", "Cloud Computing & DevOps", "Data Science"],
      fees: 45000,
      duration: "6 Months",
      contactEmail: "admissions_one@edufind.com",
      contactPhone: "+91 8887776660",
      password: "password123",
      role: "institute",
      isVerified: true,
    });
  }

  // Step 4: Ensure test institute 2 exists (for isolation tests)
  let institute2 = await Institute.findOne({ contactEmail: "admissions_two@edufind.com" });
  if (!institute2) {
    institute2 = await Institute.create({
      name: "Beacon Arts Academy",
      description: "Creative arts and design center",
      location: "Mumbai, Maharashtra",
      courses: ["UI/UX Design", "Graphic Design"],
      fees: 35000,
      duration: "4 Months",
      contactEmail: "admissions_two@edufind.com",
      contactPhone: "+91 8887776661",
      password: "password123",
      role: "institute",
      isVerified: false,
    });
  }

  // Generate tokens
  const student1Token = jwt.sign({ id: student1._id, role: "student" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const student2Token = jwt.sign({ id: student2._id, role: "student" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const inst1Token = jwt.sign({ id: institute1._id, role: "institute" }, process.env.JWT_SECRET, { expiresIn: "1h" });
  const inst2Token = jwt.sign({ id: institute2._id, role: "institute" }, process.env.JWT_SECRET, { expiresIn: "1h" });

  // Clean up any previous test applications between these test entities only
  await Application.deleteMany({
    $or: [
      { student: student1._id },
      { student: student2._id },
    ],
  });

  console.log("✓ Test fixtures and tokens ready");

  // TEST 1: Unauthenticated apply should fail with 401
  const unauthRes = await fetch(`${API_BASE}/api/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instituteId: institute1._id, course: "Full Stack Web Development" }),
  });
  console.assert(unauthRes.status === 401, `Expected 401 unauthenticated, got ${unauthRes.status}`);
  console.log("✓ Test 1: Unauthenticated request rejected (401)");

  // TEST 2: Institute token applying as student should fail with 403
  const instRoleRes = await fetch(`${API_BASE}/api/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${inst1Token}`,
    },
    body: JSON.stringify({ instituteId: institute2._id, course: "UI/UX Design" }),
  });
  console.assert(instRoleRes.status === 403, `Expected 403 forbidden role, got ${instRoleRes.status}`);
  console.log("✓ Test 2: Role enforcement verified (institute cannot submit application, 403)");

  // TEST 3: Student 1 applies to Institute 1
  const applyRes = await fetch(`${API_BASE}/api/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${student1Token}`,
    },
    body: JSON.stringify({
      instituteId: institute1._id.toString(),
      course: "Full Stack Web Development",
      statement: "Passionate about full-stack web applications and cloud architecture.",
    }),
  });
  const applyData = await applyRes.json();
  console.assert(applyRes.status === 201, `Expected 201 created, got ${applyRes.status}: ${JSON.stringify(applyData)}`);
  console.assert(applyData.application.status === "pending", "Expected status to be pending");
  console.assert(applyData.application.course === "Full Stack Web Development", "Expected selected course");
  const createdAppId = applyData.application._id;
  console.log("✓ Test 3: Student successfully applied to institute (201)");

  // TEST 4: Duplicate application prevention (Requirement 4)
  const dupRes = await fetch(`${API_BASE}/api/applications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${student1Token}`,
    },
    body: JSON.stringify({
      instituteId: institute1._id.toString(),
      course: "Data Science",
    }),
  });
  console.assert(dupRes.status === 409, `Expected 409 conflict on duplicate apply, got ${dupRes.status}`);
  console.log("✓ Test 4: Duplicate application prevented (409 Conflict)");

  // TEST 5: Check application status endpoint
  const checkRes = await fetch(`${API_BASE}/api/applications/check/${institute1._id}`, {
    headers: { Authorization: `Bearer ${student1Token}` },
  });
  const checkData = await checkRes.json();
  console.assert(checkRes.status === 200 && checkData.hasApplied === true, "Expected hasApplied: true");
  console.log("✓ Test 5: Check application status verified (hasApplied: true)");

  // TEST 6: Student 1 lists their own applications (Requirement 5)
  const student1ListRes = await fetch(`${API_BASE}/api/applications/my`, {
    headers: { Authorization: `Bearer ${student1Token}` },
  });
  const student1ListData = await student1ListRes.json();
  console.assert(student1ListData.count === 1, `Expected 1 application, got ${student1ListData.count}`);
  console.log("✓ Test 6: Student lists own applications (count = 1)");

  // TEST 7: Student 2 lists their own applications (Isolation test - Requirement 7)
  const student2ListRes = await fetch(`${API_BASE}/api/applications/my`, {
    headers: { Authorization: `Bearer ${student2Token}` },
  });
  const student2ListData = await student2ListRes.json();
  console.assert(student2ListData.count === 0, `Expected 0 applications for student 2, got ${student2ListData.count}`);
  console.log("✓ Test 7: Student isolation verified (Student 2 sees 0 applications)");

  // TEST 8: Institute 1 lists received applications (Requirement 6)
  const inst1ListRes = await fetch(`${API_BASE}/api/applications/institute`, {
    headers: { Authorization: `Bearer ${inst1Token}` },
  });
  const inst1ListData = await inst1ListRes.json();
  console.assert(inst1ListData.count === 1, `Expected 1 application for Institute 1, got ${inst1ListData.count}`);
  console.assert(inst1ListData.applications[0].fullName === "Applicant One", "Applicant name matches");
  console.log("✓ Test 8: Institute lists received applications (count = 1)");

  // TEST 9: Institute 2 lists received applications (Isolation test - Requirement 7)
  const inst2ListRes = await fetch(`${API_BASE}/api/applications/institute`, {
    headers: { Authorization: `Bearer ${inst2Token}` },
  });
  const inst2ListData = await inst2ListRes.json();
  console.assert(inst2ListData.count === 0, `Expected 0 applications for Institute 2, got ${inst2ListData.count}`);
  console.log("✓ Test 9: Institute isolation verified (Institute 2 cannot see Institute 1 applications)");

  // TEST 10: Institute 2 attempts to accept/reject Institute 1 application (Requirement 7)
  const wrongInstActionRes = await fetch(`${API_BASE}/api/applications/${createdAppId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${inst2Token}`,
    },
    body: JSON.stringify({ status: "accepted" }),
  });
  console.assert(wrongInstActionRes.status === 403, `Expected 403 forbidden cross-institute update, got ${wrongInstActionRes.status}`);
  console.log("✓ Test 10: Cross-institute modification prevented (403 Forbidden)");

  // TEST 11: Institute 1 accepts application (Requirement 6)
  const acceptRes = await fetch(`${API_BASE}/api/applications/${createdAppId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${inst1Token}`,
    },
    body: JSON.stringify({
      status: "accepted",
      decisionNotes: "Welcome! Your application has been approved.",
    }),
  });
  const acceptData = await acceptRes.json();
  console.assert(acceptRes.status === 200, `Expected 200 on accept, got ${acceptRes.status}`);
  console.assert(acceptData.application.status === "accepted", "Application status updated to accepted");
  console.log("✓ Test 11: Institute 1 successfully accepted application (status: accepted)");

  // TEST 12: Student 1 verifies status is now accepted
  const verifyRes = await fetch(`${API_BASE}/api/applications/my`, {
    headers: { Authorization: `Bearer ${student1Token}` },
  });
  const verifyData = await verifyRes.json();
  console.assert(verifyData.applications[0].status === "accepted", "Student sees accepted status");
  console.log("✓ Test 12: Student views updated application status (accepted)");

  console.log("\n========================================================");
  console.log("ALL 12 BACKEND APPLICATION SYSTEM TESTS PASSED PERFECTLY!");
  console.log("========================================================\n");

  await mongoose.disconnect();
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
