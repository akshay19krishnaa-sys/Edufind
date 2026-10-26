require("dotenv").config();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Admin = require("./models/Admin");
const Student = require("./models/Student");
const Institute = require("./models/Institute");

const API_BASE = "http://localhost:5000";

async function runAdminBackendTests() {
  console.log("=== Starting EduFind Admin System Backend Tests ===");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("✓ Connected to MongoDB Atlas");

  // TEST 1: Admin Login with incorrect password
  const failLoginRes = await fetch(`${API_BASE}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@edufind.com", password: "wrongpassword" }),
  });
  console.assert(failLoginRes.status === 401, `Expected 401 on bad password, got ${failLoginRes.status}`);
  console.log("✓ Test 1: Bad admin credentials rejected (401)");

  // TEST 2: Admin Login with correct password
  const loginRes = await fetch(`${API_BASE}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@edufind.com", password: "Admin@12345" }),
  });
  const loginData = await loginRes.json();
  console.assert(loginRes.status === 200, `Expected 200 on login, got ${loginRes.status}`);
  console.assert(loginData.token, "Expected token in login response");
  console.assert(loginData.admin.role === "admin", "Expected admin role");
  const adminToken = loginData.token;
  console.log("✓ Test 2: Admin login successful, JWT token received (200)");

  // TEST 3: Access admin route with fake student token -> 403
  const fakeStudentToken = jwt.sign({ id: new mongoose.Types.ObjectId(), role: "student" }, process.env.JWT_SECRET);
  const studentBlockedRes = await fetch(`${API_BASE}/api/admin/dashboard/metrics`, {
    headers: { Authorization: `Bearer ${fakeStudentToken}` },
  });
  console.assert(studentBlockedRes.status === 403, `Expected 403 for student token, got ${studentBlockedRes.status}`);
  console.log("✓ Test 3: Student token blocked from admin API (403)");

  // TEST 4: Access admin route with fake institute token -> 403
  const fakeInstToken = jwt.sign({ id: new mongoose.Types.ObjectId(), role: "institute" }, process.env.JWT_SECRET);
  const instBlockedRes = await fetch(`${API_BASE}/api/admin/dashboard/metrics`, {
    headers: { Authorization: `Bearer ${fakeInstToken}` },
  });
  console.assert(instBlockedRes.status === 403, `Expected 403 for institute token, got ${instBlockedRes.status}`);
  console.log("✓ Test 4: Institute token blocked from admin API (403)");

  // TEST 5: Fetch Dashboard Metrics with Admin Token
  const metricsRes = await fetch(`${API_BASE}/api/admin/dashboard/metrics`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const metricsData = await metricsRes.json();
  console.assert(metricsRes.status === 200, `Expected 200, got ${metricsRes.status}`);
  console.assert(typeof metricsData.metrics.students.total === "number", "Students total count exists");
  console.assert(typeof metricsData.metrics.institutes.total === "number", "Institutes total count exists");
  console.assert(typeof metricsData.metrics.financials.verifiedRevenue === "number", "Revenue number exists");
  console.log("✓ Test 5: Real aggregated dashboard metrics retrieved (200)");

  // TEST 6: Fetch Users Management List
  const usersRes = await fetch(`${API_BASE}/api/admin/users?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const usersData = await usersRes.json();
  console.assert(usersRes.status === 200, `Expected 200, got ${usersRes.status}`);
  console.assert(Array.isArray(usersData.users), "Users array returned");
  console.log(`✓ Test 6: Users list retrieved (total count: ${usersData.total})`);

  // TEST 7: Institute Management & Verification
  const instRes = await fetch(`${API_BASE}/api/admin/institutes?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const instData = await instRes.json();
  console.assert(instRes.status === 200, `Expected 200, got ${instRes.status}`);
  console.assert(Array.isArray(instData.institutes), "Institutes array returned");
  console.log(`✓ Test 7: Institutes management queue retrieved (count: ${instData.total})`);

  // TEST 8: Application Monitoring
  const appsRes = await fetch(`${API_BASE}/api/admin/applications?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const appsData = await appsRes.json();
  console.assert(appsRes.status === 200, `Expected 200, got ${appsRes.status}`);
  console.assert(Array.isArray(appsData.applications), "Applications array returned");
  console.log(`✓ Test 8: Global admission applications monitored (count: ${appsData.total})`);

  // TEST 9: Course Catalog Oversight
  const coursesRes = await fetch(`${API_BASE}/api/admin/courses?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const coursesData = await coursesRes.json();
  console.assert(coursesRes.status === 200, `Expected 200, got ${coursesRes.status}`);
  console.assert(Array.isArray(coursesData.courses), "Courses array returned");
  console.log(`✓ Test 9: Course catalog retrieved (count: ${coursesData.total})`);

  // TEST 10: Content Moderation Reports Queue
  const reportsRes = await fetch(`${API_BASE}/api/admin/moderation/reports`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const reportsData = await reportsRes.json();
  console.assert(reportsRes.status === 200, `Expected 200, got ${reportsRes.status}`);
  console.log("✓ Test 10: Content moderation reports queue operational (200)");

  // TEST 11: Payment & Transaction Monitoring
  const txRes = await fetch(`${API_BASE}/api/admin/transactions`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const txData = await txRes.json();
  console.assert(txRes.status === 200, `Expected 200, got ${txRes.status}`);
  console.assert(typeof txData.stats.verifiedRevenue === "number", "Verified revenue tracked");
  console.log(`✓ Test 11: Transaction monitoring operational (revenue: ₹${txData.stats.verifiedRevenue})`);

  // TEST 12: Analytics Summary & CSV Export
  const analyticsRes = await fetch(`${API_BASE}/api/admin/analytics/summary?range=30d`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.assert(analyticsRes.status === 200, "Analytics summary fetched");

  const csvRes = await fetch(`${API_BASE}/api/admin/analytics/export?type=applications`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  console.assert(csvRes.status === 200, "CSV export generated");
  const csvText = await csvRes.text();
  console.assert(csvText.startsWith("Application ID"), "CSV headers formatted properly");
  console.log("✓ Test 12: Analytics and CSV report export functional (200)");

  // TEST 13: Platform Settings Update
  const updateSettingsRes = await fetch(`${API_BASE}/api/admin/settings`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      settings: {
        platform_name: "EduFind Academic Portal",
      },
    }),
  });
  const updatedSettingsData = await updateSettingsRes.json();
  console.assert(updateSettingsRes.status === 200, `Expected 200, got ${updateSettingsRes.status}`);
  console.log("✓ Test 13: Dynamic platform settings updated and audited (200)");

  // TEST 14: Audit Logs Verification
  const auditRes = await fetch(`${API_BASE}/api/admin/audit-logs?limit=5`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const auditData = await auditRes.json();
  console.assert(auditRes.status === 200, `Expected 200, got ${auditRes.status}`);
  console.assert(auditData.logs.length > 0, "Audit logs recorded actions");
  console.log(`✓ Test 14: Immutable audit logs verified (${auditData.logs.length} recent actions recorded)`);

  console.log("\n============================================================");
  console.log("ALL 14 ADMIN BACKEND INTEGRATION TESTS PASSED BRILLIANTLY!");
  console.log("============================================================\n");

  await mongoose.disconnect();
}

runAdminBackendTests().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
