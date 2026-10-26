import { Route, Routes, Navigate } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import InstituteAuthLayout from "./layouts/InstituteAuthLayout";
import AdminLayout from "./layouts/AdminLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ExploreInstitutes from "./pages/ExploreInstitutes";
import InstituteDetail from "./pages/InstituteDetail";
import InstituteLogin from "./pages/institute/InstituteLogin";
import InstituteRegister from "./pages/institute/InstituteRegister";
import InstituteDashboard from "./pages/institute/InstituteDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import InstituteManagement from "./pages/admin/InstituteManagement";
import CourseModeration from "./pages/admin/CourseModeration";
import ApplicationMonitoring from "./pages/admin/ApplicationMonitoring";
import ContentModeration from "./pages/admin/ContentModeration";
import FeaturedInstitutes from "./pages/admin/FeaturedInstitutes";
import TransactionMonitoring from "./pages/admin/TransactionMonitoring";
import ReportsAnalytics from "./pages/admin/ReportsAnalytics";
import PlatformSettings from "./pages/admin/PlatformSettings";
import AuditLogs from "./pages/admin/AuditLogs";

function App() {
  return (
    <Routes>
      {/* Public student and general browsing routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/institutes" element={<ExploreInstitutes />} />
        <Route path="/institutes/:id" element={<InstituteDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Institute auth routes */}
      <Route path="/institute" element={<InstituteAuthLayout />}>
        <Route path="login" element={<InstituteLogin />} />
        <Route path="register" element={<InstituteRegister />} />
      </Route>

      {/* Protected student routes */}
      <Route element={<ProtectedRoute requiredRole="student" />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
      </Route>

      {/* Protected institute routes */}
      <Route element={<ProtectedRoute requiredRole="institute" />}>
        <Route path="/institute/dashboard" element={<InstituteDashboard />} />
      </Route>

      {/* Public Admin Login route */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Protected Admin Control Center */}
      <Route element={<ProtectedRoute requiredRole="admin" />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UserManagement />} />
          <Route path="/admin/institutes" element={<InstituteManagement />} />
          <Route path="/admin/courses" element={<CourseModeration />} />
          <Route path="/admin/applications" element={<ApplicationMonitoring />} />
          <Route path="/admin/moderation" element={<ContentModeration />} />
          <Route path="/admin/featured-institutes" element={<FeaturedInstitutes />} />
          <Route path="/admin/transactions" element={<TransactionMonitoring />} />
          <Route path="/admin/analytics" element={<ReportsAnalytics />} />
          <Route path="/admin/settings" element={<PlatformSettings />} />
          <Route path="/admin/audit-logs" element={<AuditLogs />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
