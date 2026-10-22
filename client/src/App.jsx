import { Route, Routes } from "react-router-dom";
import PublicLayout from "./layouts/PublicLayout";
import InstituteAuthLayout from "./layouts/InstituteAuthLayout";
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

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/institutes" element={<ExploreInstitutes />} />
        <Route path="/institutes/:id" element={<InstituteDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route path="/institute" element={<InstituteAuthLayout />}>
        <Route path="login" element={<InstituteLogin />} />
        <Route path="register" element={<InstituteRegister />} />
      </Route>

      {/* Protected student routes — full-screen layout, no public Navbar */}
      <Route element={<ProtectedRoute requiredRole="student" />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
      </Route>

      {/* Protected institute routes */}
      <Route element={<ProtectedRoute requiredRole="institute" />}>
        <Route path="/institute/dashboard" element={<InstituteDashboard />} />
      </Route>
    </Routes>
  );
}

export default App;

