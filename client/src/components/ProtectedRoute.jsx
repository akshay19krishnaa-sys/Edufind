import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useInstituteAuth } from "../context/InstituteAuthContext";

/**
 * Wraps protected routes.
 *
 * Supports both role="student" and role="institute" routes without cross-contamination.
 */
function ProtectedRoute({ requiredRole = "student" }) {
  const { isAuthenticated: isStudentAuth, student } = useAuth();
  const { isAuthenticated: isInstAuth, institute } = useInstituteAuth();

  if (requiredRole === "institute") {
    if (!isInstAuth) {
      return <Navigate to="/institute/login" replace />;
    }

    if (institute?.role && institute.role !== "institute") {
      return <Navigate to="/" replace />;
    }

    return <Outlet />;
  }

  // Student protection (unchanged behavior)
  if (!isStudentAuth) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && student?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
