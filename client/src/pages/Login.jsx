import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Auth.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
    setSuccessMessage("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Email address is required";
    }

    if (!form.password) {
      nextErrors.password = "Password is required";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    setSuccessMessage("");

    if (!validate()) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setServerError(data.message || "Login failed. Please try again.");
        return;
      }

      // Persist token + student data via AuthContext (student-only keys)
      if (data.token && data.student) {
        login(data.token, data.student);
      } else if (data.token) {
        login(data.token, null);
      }

      setSuccessMessage(data.message || "Login successful");
      setTimeout(() => {
        navigate("/student/dashboard");
      }, 500);
    } catch {
      setServerError(
        "Unable to reach the server. Please confirm the API is running."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page auth-page--student">
      <div className="auth-card">
        <div className="auth-brand-header">
          <Link to="/" aria-label="EduFind Home">
            <img
              src="/images/edufind-logo-clean.png"
              alt="EduFind"
              className="auth-brand-logo"
            />
          </Link>
        </div>
        <span className="auth-badge auth-badge--student">Student</span>
        <h1 className="auth-title">Student Login</h1>
        <p className="auth-subtitle">
          Sign in to save institutes, track comparisons, and continue your
          learning journey.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="student-login-email">Email Address</label>
            <input
              id="student-login-email"
              name="email"
              type="email"
              className={`auth-input ${errors.email ? "auth-input--error" : ""}`}
              placeholder="you@example.com"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
            />
            {errors.email && <p className="auth-error">{errors.email}</p>}
          </div>

          <div className="auth-field">
            <label htmlFor="student-login-password">Password</label>
            <div className="auth-password-wrap">
              <input
                id="student-login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                className={`auth-input ${errors.password ? "auth-input--error" : ""}`}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && <p className="auth-error">{errors.password}</p>}
          </div>

          {serverError && (
            <p className="auth-alert auth-alert--error" role="alert">
              {serverError}
            </p>
          )}

          {successMessage && (
            <p className="auth-alert auth-alert--success" role="status">
              {successMessage}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-switch">
          New here? <Link to="/register">Create a student account</Link>
        </p>

        <p className="auth-cross-link">
          Are you an institute?{" "}
          <Link to="/institute/register">Register your institute here.</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
