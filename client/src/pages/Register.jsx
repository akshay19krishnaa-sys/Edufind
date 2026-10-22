import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

const QUALIFICATION_OPTIONS = [
  "SSLC",
  "Higher Secondary (+2)",
  "Diploma",
  "ITI",
  "Undergraduate",
  "Postgraduate",
  "Other",
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s-]{7,18}\d$/;

const initialForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  gender: "",
  qualification: "",
};

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    if (!form.name.trim()) {
      nextErrors.name = "Full name is required";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email address is required";
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (!form.phone.trim()) {
      nextErrors.phone = "Phone number is required";
    } else if (!PHONE_REGEX.test(form.phone.trim())) {
      nextErrors.phone = "Please enter a valid phone number";
    }

    if (!form.password) {
      nextErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
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

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      password: form.password,
    };

    if (form.gender) {
      payload.gender = form.gender;
    }

    if (form.qualification) {
      payload.qualification = form.qualification;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setServerError(data.message || "Registration failed. Please try again.");
        return;
      }

      setSuccessMessage(data.message || "Student registered successfully");
      setForm(initialForm);

      if (data.token) {
        localStorage.setItem("edufind_student_token", data.token);
      }

      setTimeout(() => {
        navigate("/login");
      }, 1200);
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
      <div className="auth-card auth-card--wide">
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
        <h1 className="auth-title">Create Student Account</h1>
        <p className="auth-subtitle">
          Get started to discover institutes, compare courses, and find the
          right learning path.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="student-register-name">
              Full Name <span className="auth-required">*</span>
            </label>
            <input
              id="student-register-name"
              name="name"
              type="text"
              className={`auth-input ${errors.name ? "auth-input--error" : ""}`}
              placeholder="Enter your full name"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
            />
            {errors.name && <p className="auth-error">{errors.name}</p>}
          </div>

          <div className="auth-field">
            <label htmlFor="student-register-email">
              Email Address <span className="auth-required">*</span>
            </label>
            <input
              id="student-register-email"
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
            <label htmlFor="student-register-phone">
              Phone Number <span className="auth-required">*</span>
            </label>
            <input
              id="student-register-phone"
              name="phone"
              type="tel"
              className={`auth-input ${errors.phone ? "auth-input--error" : ""}`}
              placeholder="e.g. 9876543210"
              autoComplete="tel"
              value={form.phone}
              onChange={handleChange}
            />
            {errors.phone && <p className="auth-error">{errors.phone}</p>}
          </div>

          <div className="auth-field">
            <label htmlFor="student-register-password">
              Password <span className="auth-required">*</span>
            </label>
            <div className="auth-password-wrap">
              <input
                id="student-register-password"
                name="password"
                type={showPassword ? "text" : "password"}
                className={`auth-input ${errors.password ? "auth-input--error" : ""}`}
                placeholder="Create a password"
                autoComplete="new-password"
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

          <div className="auth-field">
            <label htmlFor="student-register-confirm">
              Confirm Password <span className="auth-required">*</span>
            </label>
            <div className="auth-password-wrap">
              <input
                id="student-register-confirm"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                className={`auth-input ${errors.confirmPassword ? "auth-input--error" : ""}`}
                placeholder="Re-enter your password"
                autoComplete="new-password"
                value={form.confirmPassword}
                onChange={handleChange}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="auth-error">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="student-register-gender">
              Gender <span className="auth-optional">(optional)</span>
            </label>
            <select
              id="student-register-gender"
              name="gender"
              className="auth-input auth-select"
              value={form.gender}
              onChange={handleChange}
            >
              <option value="">Select gender</option>
              {GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="auth-field">
            <label htmlFor="student-register-qualification">
              Highest Qualification{" "}
              <span className="auth-optional">(optional)</span>
            </label>
            <select
              id="student-register-qualification"
              name="qualification"
              className="auth-input auth-select"
              value={form.qualification}
              onChange={handleChange}
            >
              <option value="">Select qualification</option>
              {QUALIFICATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
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
            {submitting ? "Creating account..." : "Get Started"}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Student Login</Link>
        </p>

        <p className="auth-cross-link">
          Are you an institute?{" "}
          <Link to="/institute/register">Register your institute here.</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
