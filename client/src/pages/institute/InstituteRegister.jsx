import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/Auth.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s-]{7,18}\d$/;

const initialForm = {
  name: "",
  description: "",
  location: "",
  fees: "",
  duration: "",
  contactEmail: "",
  contactPhone: "",
  password: "",
  confirmPassword: "",
  image: "",
};

function InstituteRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [courses, setCourses] = useState([""]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ── Form field handlers ───────────────────────────────────────────────────

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setServerError("");
    setSuccessMessage("");
  };

  // ── Courses multi-input handlers ──────────────────────────────────────────

  const handleCourseChange = (index, value) => {
    setCourses((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setErrors((prev) => ({ ...prev, courses: "" }));
    setServerError("");
    setSuccessMessage("");
  };

  const addCourse = () => {
    setCourses((prev) => [...prev, ""]);
  };

  const removeCourse = (index) => {
    setCourses((prev) => {
      if (prev.length === 1) return [""];
      return prev.filter((_, i) => i !== index);
    });
  };

  // ── Validation ────────────────────────────────────────────────────────────

  const validate = () => {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Institute name is required";
    }

    if (!form.description.trim()) {
      nextErrors.description = "Description is required";
    }

    if (!form.location.trim()) {
      nextErrors.location = "Location is required";
    }

    if (form.fees === "") {
      nextErrors.fees = "Course fees are required";
    } else if (isNaN(Number(form.fees)) || Number(form.fees) < 0) {
      nextErrors.fees = "Fees must be a non-negative number";
    }

    if (!form.duration.trim()) {
      nextErrors.duration = "Course duration is required";
    }

    if (!form.contactEmail.trim()) {
      nextErrors.contactEmail = "Contact email is required";
    } else if (!EMAIL_REGEX.test(form.contactEmail.trim())) {
      nextErrors.contactEmail = "Please enter a valid email address";
    }

    if (!form.contactPhone.trim()) {
      nextErrors.contactPhone = "Contact phone number is required";
    } else if (!PHONE_REGEX.test(form.contactPhone.trim())) {
      nextErrors.contactPhone = "Please enter a valid phone number";
    }

    if (!form.password) {
      nextErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters long";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    setSuccessMessage("");

    if (!validate()) return;

    const sanitisedCourses = courses
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      courses: sanitisedCourses,
      fees: Number(form.fees),
      duration: form.duration.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim(),
      password: form.password,
    };

    if (form.image.trim()) {
      payload.image = form.image.trim();
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE}/api/institutes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setServerError(data.message || "Registration failed. Please try again.");
        return;
      }

      setSuccessMessage(
        data.message || "Institute registered successfully! Redirecting to login…"
      );
      setForm(initialForm);
      setCourses([""]);

      setTimeout(() => {
        navigate("/institute/login");
      }, 1800);
    } catch {
      setServerError(
        "Unable to reach the server. Please confirm the API is running."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="institute-auth-panel institute-auth-panel--wide">
      <div className="institute-auth-intro">
        <h1>Register Your Institute</h1>
        <p>Showcase your programs and reach students looking for quality training.</p>
      </div>

      <div className="auth-card auth-card--institute auth-card--institute-wide">
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
        <h2 className="auth-title">Create institute profile</h2>
        <p className="auth-subtitle">
          Join EduFind to list your courses, share fees, and connect with
          prospective learners across the region.
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* ── Section: Basic Info ── */}
          <div className="auth-section-label">Basic Information</div>

          <div className="auth-field">
            <label htmlFor="inst-reg-name">
              Institute Name <span className="auth-required">*</span>
            </label>
            <input
              id="inst-reg-name"
              name="name"
              type="text"
              className={`auth-input ${errors.name ? "auth-input--error" : ""}`}
              placeholder="e.g. Apex Training Academy"
              autoComplete="organization"
              value={form.name}
              onChange={handleChange}
            />
            {errors.name && <p className="auth-error">{errors.name}</p>}
          </div>

          <div className="auth-field">
            <label htmlFor="inst-reg-description">
              Institute Description <span className="auth-required">*</span>
            </label>
            <textarea
              id="inst-reg-description"
              name="description"
              className={`auth-input auth-textarea ${errors.description ? "auth-input--error" : ""}`}
              placeholder="Briefly describe your institute, its mission, and what makes it unique…"
              rows={3}
              value={form.description}
              onChange={handleChange}
            />
            {errors.description && (
              <p className="auth-error">{errors.description}</p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="inst-reg-location">
              Location <span className="auth-required">*</span>
            </label>
            <input
              id="inst-reg-location"
              name="location"
              type="text"
              className={`auth-input ${errors.location ? "auth-input--error" : ""}`}
              placeholder="e.g. Chennai, Tamil Nadu"
              autoComplete="address-level2"
              value={form.location}
              onChange={handleChange}
            />
            {errors.location && <p className="auth-error">{errors.location}</p>}
          </div>

          {/* ── Section: Courses ── */}
          <div className="auth-section-label">Courses Offered</div>

          <div className="auth-field">
            <label>
              Courses <span className="auth-optional">(optional)</span>
            </label>
            <div className="courses-list">
              {courses.map((course, index) => (
                <div key={index} className="course-row">
                  <input
                    id={`inst-reg-course-${index}`}
                    type="text"
                    className="auth-input course-input"
                    placeholder={`Course ${index + 1}, e.g. Web Development`}
                    value={course}
                    onChange={(e) => handleCourseChange(index, e.target.value)}
                  />
                  <button
                    type="button"
                    className="course-remove-btn"
                    onClick={() => removeCourse(index)}
                    aria-label={`Remove course ${index + 1}`}
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="add-course-btn"
              onClick={addCourse}
            >
              + Add another course
            </button>
            {errors.courses && <p className="auth-error">{errors.courses}</p>}
          </div>

          {/* ── Section: Fees & Duration ── */}
          <div className="auth-section-label">Fees &amp; Duration</div>

          <div className="auth-row-two">
            <div className="auth-field">
              <label htmlFor="inst-reg-fees">
                Course Fees (₹) <span className="auth-required">*</span>
              </label>
              <input
                id="inst-reg-fees"
                name="fees"
                type="number"
                min="0"
                step="any"
                className={`auth-input ${errors.fees ? "auth-input--error" : ""}`}
                placeholder="e.g. 15000"
                value={form.fees}
                onChange={handleChange}
              />
              {errors.fees && <p className="auth-error">{errors.fees}</p>}
            </div>

            <div className="auth-field">
              <label htmlFor="inst-reg-duration">
                Duration <span className="auth-required">*</span>
              </label>
              <input
                id="inst-reg-duration"
                name="duration"
                type="text"
                className={`auth-input ${errors.duration ? "auth-input--error" : ""}`}
                placeholder="e.g. 6 months"
                value={form.duration}
                onChange={handleChange}
              />
              {errors.duration && (
                <p className="auth-error">{errors.duration}</p>
              )}
            </div>
          </div>

          {/* ── Section: Contact ── */}
          <div className="auth-section-label">Contact Details</div>

          <div className="auth-field">
            <label htmlFor="inst-reg-email">
              Official Contact Email <span className="auth-required">*</span>
            </label>
            <input
              id="inst-reg-email"
              name="contactEmail"
              type="email"
              className={`auth-input ${errors.contactEmail ? "auth-input--error" : ""}`}
              placeholder="admin@yourinstitute.com"
              autoComplete="email"
              value={form.contactEmail}
              onChange={handleChange}
            />
            {errors.contactEmail && (
              <p className="auth-error">{errors.contactEmail}</p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="inst-reg-phone">
              Contact Phone Number <span className="auth-required">*</span>
            </label>
            <input
              id="inst-reg-phone"
              name="contactPhone"
              type="tel"
              className={`auth-input ${errors.contactPhone ? "auth-input--error" : ""}`}
              placeholder="e.g. 9876543210"
              autoComplete="tel"
              value={form.contactPhone}
              onChange={handleChange}
            />
            {errors.contactPhone && (
              <p className="auth-error">{errors.contactPhone}</p>
            )}
          </div>

          {/* ── Section: Credentials ── */}
          <div className="auth-section-label">Account Credentials</div>

          <div className="auth-field">
            <label htmlFor="inst-reg-password">
              Password <span className="auth-required">*</span>
            </label>
            <input
              id="inst-reg-password"
              name="password"
              type="password"
              className={`auth-input ${errors.password ? "auth-input--error" : ""}`}
              placeholder="Create a password (min. 6 characters)"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
            />
            {errors.password && (
              <p className="auth-error">{errors.password}</p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="inst-reg-confirm-password">
              Confirm Password <span className="auth-required">*</span>
            </label>
            <input
              id="inst-reg-confirm-password"
              name="confirmPassword"
              type="password"
              className={`auth-input ${errors.confirmPassword ? "auth-input--error" : ""}`}
              placeholder="Confirm your password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && (
              <p className="auth-error">{errors.confirmPassword}</p>
            )}
          </div>

          {/* ── Section: Image ── */}
          <div className="auth-section-label">Media</div>

          <div className="auth-field">
            <label htmlFor="inst-reg-image">
              Institute Image URL{" "}
              <span className="auth-optional">(optional)</span>
            </label>
            <input
              id="inst-reg-image"
              name="image"
              type="url"
              className="auth-input"
              placeholder="https://example.com/institute-photo.jpg"
              value={form.image}
              onChange={handleChange}
            />
            <p className="auth-hint">
              Paste a publicly accessible image URL. Image upload will be
              available soon.
            </p>
          </div>

          {/* ── Alerts ── */}
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

          <button
            type="submit"
            id="inst-reg-submit"
            className="auth-submit auth-submit--institute"
            disabled={submitting}
          >
            {submitting ? "Registering…" : "Register Institute"}
          </button>
        </form>

        <p className="auth-cross-link">
          Already registered?{" "}
          <Link to="/institute/login">Sign in to your institute.</Link>
        </p>
      </div>
    </div>
  );
}

export default InstituteRegister;
