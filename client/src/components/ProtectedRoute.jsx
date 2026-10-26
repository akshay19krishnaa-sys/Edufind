import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useInstituteAuth } from "../context/InstituteAuthContext";
import { useAdminAuth, ADMIN_TOKEN_KEY } from "../context/AdminAuthContext";

/**
 * Wraps protected routes.
 *
 * Supports role="student", role="institute", and role="admin" routes without cross-contamination.
 * Redirects to the respective login page when unauthenticated or role mismatches,
 * avoiding silent redirects to the Home page.
 */
function ProtectedRoute({ requiredRole = "student" }) {
  const { isAuthenticated: isStudentAuth, student } = useAuth();
  const { isAuthenticated: isInstAuth, institute } = useInstituteAuth();
  const { isAuthenticated: isAdminAuth, admin } = useAdminAuth();

  if (requiredRole === "admin") {
    const hasStoredAdminToken = Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));

    if (!isAdminAuth && !hasStoredAdminToken) {
      return <Navigate to="/admin/login" replace />;
    }

    if (admin?.role && admin.role !== "admin") {
      return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
  }

  if (requiredRole === "institute") {
    if (!isInstAuth) {
      return <Navigate to="/institute/login" replace />;
    }

    if (institute?.role && institute.role !== "institute") {
      return <Navigate to="/institute/login" replace />;
    }

    return <Outlet />;
  }

  // Student protection
  if (!isStudentAuth) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && student?.role && student.role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
