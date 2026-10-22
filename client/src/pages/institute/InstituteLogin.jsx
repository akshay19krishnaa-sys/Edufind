import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInstituteAuth } from "../../context/InstituteAuthContext";
import "../../styles/Auth.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InstituteLogin() {
  const navigate = useNavigate();
  const { login } = useInstituteAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Work email is required";
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = "Please enter a valid email address";
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

    if (!validate()) return;

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE}/api/institutes/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setServerError(data.message || "Invalid email or password");
        return;
      }

      // Persist session into InstituteAuthContext
      login(data.token, data.institute);

      setSuccessMessage("Login successful! Redirecting to dashboard…");
      setTimeout(() => {
        navigate("/institute/dashboard", { replace: true });
      }, 600);
    } catch {
      setServerError("Unable to reach the server. Please verify your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="institute-auth-panel">
      <div className="institute-auth-intro">
        <h1>Institute Login</h1>
        <p>Access your institute dashboard and manage your profile.</p>
      </div>

      <div className="auth-card auth-card--institute">
        <div className="auth-brand-header">
          <Link to="/" aria-label="EduFind Home">
            <img
              src="/images/edufind-logo-clean.png"
              alt="EduFind"
              className="auth-brand-logo"
            />
          </Link>
        </div>
        <span className="auth-badge auth-badge--institute">Institute partners</span>
        <h2 className="auth-title">Welcome back</h2>
        <p className="auth-subtitle">
          Sign in to update courses, fees, and connect with prospective students.
        </p>

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

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="institute-login-email">
              Work email <span className="auth-required">*</span>
            </label>
            <input
              id="institute-login-email"
              name="email"
              type="email"
              className={`auth-input ${errors.email ? "auth-input--error" : ""}`}
              placeholder="admin@institute.com"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              disabled={submitting}
              required
            />
            {errors.email && <p className="auth-error">{errors.email}</p>}
          </div>

          <div className="auth-field">
            <label htmlFor="institute-login-password">
              Password <span className="auth-required">*</span>
            </label>
            <input
              id="institute-login-password"
              name="password"
              type="password"
              className={`auth-input ${errors.password ? "auth-input--error" : ""}`}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              disabled={submitting}
              required
            />
            {errors.password && <p className="auth-error">{errors.password}</p>}
          </div>

          <button
            type="submit"
            id="institute-login-submit"
            className="auth-submit auth-submit--institute"
            disabled={submitting}
          >
            {submitting ? "Signing In…" : "Institute Sign In"}
          </button>
        </form>

        <p className="auth-cross-link">
          New to EduFind?{" "}
          <Link to="/institute/register">Register your institute.</Link>
        </p>
      </div>
    </div>
  );
}

export default InstituteLogin;
