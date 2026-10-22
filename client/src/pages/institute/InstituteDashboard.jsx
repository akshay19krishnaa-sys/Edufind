import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useInstituteAuth } from "../../context/InstituteAuthContext";
import "../../styles/InstituteDashboard.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ── Inline SVG icons ── */
const Icon = {
  verified: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13.333 4L6 11.333 2.667 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  pending: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M8 5v3.5l2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  location: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1.5C5.515 1.5 3.5 3.515 3.5 6c0 3.375 4.5 8.5 4.5 8.5s4.5-5.125 4.5-8.5c0-2.485-2.015-4.5-4.5-4.5z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  logout: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  edit: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M11.5 2.5a1.414 1.414 0 012 2L4.5 13.5H2v-2.5L11.5 2.5z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  external: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M12 9v4a1 1 0 01-1 1H3a1 1 0 01-1-1V5a1 1 0 011-1h4M9 2h5v5M6.5 9.5L14 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 7v4M8 5.25v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

function formatFees(val) {
  if (val == null || val === "") return "Not specified";
  const num = Number(val);
  if (isNaN(num)) return String(val);
  if (num === 0) return "Free";
  return `₹${num.toLocaleString("en-IN")}`;
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function InstituteDashboard() {
  const navigate = useNavigate();
  const { institute, token, logout, updateInstitute } = useInstituteAuth();

  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    location: "",
    fees: "",
    duration: "",
    contactPhone: "",
    image: "",
    courses: [""],
  });

  // Sync edit form from current institute
  const resetEditForm = useCallback(() => {
    if (institute) {
      setEditForm({
        name: institute.name || "",
        description: institute.description || "",
        location: institute.location || "",
        fees: institute.fees !== undefined ? String(institute.fees) : "",
        duration: institute.duration || "",
        contactPhone: institute.contactPhone || "",
        image: institute.image || "",
        courses: Array.isArray(institute.courses) && institute.courses.length > 0
          ? [...institute.courses]
          : [""],
      });
    }
  }, [institute]);

  // Fetch fresh profile on mount
  useEffect(() => {
    let isMounted = true;
    async function loadFreshProfile() {
      if (!token) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/institutes/me/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 401) {
          // Token expired or invalid
          logout();
          navigate("/institute/login", { replace: true });
          return;
        }

        if (res.ok) {
          const data = await res.json();
          if (data.institute && isMounted) {
            updateInstitute(data.institute);
          }
        }
      } catch (err) {
        console.error("Failed to refresh institute profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFreshProfile();
    return () => { isMounted = false; };
  }, [token, logout, navigate, updateInstitute]);

  useEffect(() => {
    resetEditForm();
  }, [resetEditForm]);

  const handleLogout = () => {
    logout();
    navigate("/institute/login", { replace: true });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    setSaveError("");
    setSaveSuccess("");
  };

  const handleCourseChange = (index, value) => {
    setEditForm((prev) => {
      const next = [...prev.courses];
      next[index] = value;
      return { ...prev, courses: next };
    });
  };

  const addCourse = () => {
    setEditForm((prev) => ({ ...prev, courses: [...prev.courses, ""] }));
  };

  const removeCourse = (index) => {
    setEditForm((prev) => {
      if (prev.courses.length <= 1) return { ...prev, courses: [""] };
      return {
        ...prev,
        courses: prev.courses.filter((_, i) => i !== index),
      };
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveError("");
    setSaveSuccess("");

    if (!editForm.name.trim()) {
      setSaveError("Institute name is required");
      return;
    }
    if (!editForm.description.trim()) {
      setSaveError("Description is required");
      return;
    }
    if (!editForm.location.trim()) {
      setSaveError("Location is required");
      return;
    }

    const sanitisedCourses = editForm.courses
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const payload = {
      name: editForm.name.trim(),
      description: editForm.description.trim(),
      location: editForm.location.trim(),
      fees: Number(editForm.fees) || 0,
      duration: editForm.duration.trim(),
      contactPhone: editForm.contactPhone.trim(),
      image: editForm.image.trim(),
      courses: sanitisedCourses,
    };

    try {
      const res = await fetch(`${API_BASE}/api/institutes/me/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveError(data.message || "Failed to update profile");
        return;
      }

      updateInstitute(data.institute);
      setSaveSuccess("Profile updated successfully!");
      setTimeout(() => {
        setEditing(false);
        setSaveSuccess("");
      }, 1000);
    } catch {
      setSaveError("Unable to reach the server. Please try again.");
    }
  };

  const initials = getInitials(institute?.name || "Institute");
  const isVerified = Boolean(institute?.isVerified);

  return (
    <div className="id-shell">
      {/* ── Navbar ── */}
      <header className="id-navbar">
        <div className="id-navbar-inner">
          <Link to="/" className="id-brand" aria-label="EduFind Home">
            <img
              src="/images/edufind-logo-clean.png"
              alt="EduFind"
              className="id-brand-logo"
            />
            <span className="id-brand-tag">Partner Portal</span>
          </Link>

          <div className="id-nav-actions">
            {institute?._id && (
              <Link
                to={`/institutes/${institute._id}`}
                className="id-public-link"
                target="_blank"
                rel="noreferrer"
                title="Preview public profile"
              >
                Public Page {Icon.external}
              </Link>
            )}
            <button
              type="button"
              id="institute-logout-btn"
              className="id-logout-btn"
              onClick={handleLogout}
              aria-label="Logout from institute dashboard"
            >
              {Icon.logout} Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Container ── */}
      <main className="id-container">
        {/* Verification Status Banner */}
        {!isVerified && (
          <div className="id-verification-banner id-verification-banner--pending" role="note">
            {Icon.info}
            <div>
              <strong>Profile Pending Verification:</strong> Your institute profile is currently under review by the EduFind team.
              Prospective students can view self-reported courses and fees. Platform verification is administered exclusively by EduFind and cannot be modified by institutes.
            </div>
          </div>
        )}

        {/* ── Hero Profile Card ── */}
        <div className="id-hero-card">
          <div className="id-hero-main">
            <div className="id-hero-avatar">
              {institute?.image ? (
                <img
                  src={institute.image}
                  alt={institute?.name || "Institute"}
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
              ) : (
                initials
              )}
            </div>

            <div className="id-hero-info">
              <div className="id-hero-title-row">
                <h1 className="id-institute-name">{institute?.name || "Institute"}</h1>
                {isVerified ? (
                  <span className="id-badge id-badge--verified">
                    {Icon.verified} Verified Partner
                  </span>
                ) : (
                  <span className="id-badge id-badge--pending">
                    {Icon.pending} Pending Verification
                  </span>
                )}
              </div>

              {institute?.location && (
                <span className="id-hero-location">
                  {Icon.location} {institute.location}
                </span>
              )}

              {institute?.description && (
                <p className="id-hero-desc">{institute.description}</p>
              )}
            </div>
          </div>

          <div className="id-hero-actions">
            <button
              type="button"
              id="edit-institute-profile-btn"
              className="id-btn-primary"
              onClick={() => {
                resetEditForm();
                setEditing(true);
              }}
            >
              {Icon.edit} Edit Profile
            </button>
          </div>
        </div>

        {/* ── Quick Metrics Grid ── */}
        <div className="id-grid">
          <div className="id-card">
            <p className="id-card-label">Programs Offered</p>
            <p className="id-card-value">{institute?.courses?.length || 0}</p>
            <p className="id-card-sub">Active training tracks</p>
          </div>

          <div className="id-card">
            <p className="id-card-label">Estimated Fees</p>
            <p className="id-card-value">{formatFees(institute?.fees)}</p>
            <p className="id-card-sub">Base course pricing</p>
          </div>

          <div className="id-card">
            <p className="id-card-label">Typical Duration</p>
            <p className="id-card-value">{institute?.duration || "Not specified"}</p>
            <p className="id-card-sub">Program timeline</p>
          </div>

          <div className="id-card">
            <p className="id-card-label">Account Contact</p>
            <p className="id-card-value" style={{ fontSize: "1rem", wordBreak: "break-all" }}>
              {institute?.contactEmail || "—"}
            </p>
            <p className="id-card-sub">{institute?.contactPhone || "No phone listed"}</p>
          </div>
        </div>

        {/* ── Courses Section ── */}
        <div className="id-section-card">
          <div className="id-section-header">
            <h2 className="id-section-title">Courses &amp; Training Tracks</h2>
          </div>

          {Array.isArray(institute?.courses) && institute.courses.length > 0 ? (
            <div className="id-courses-wrap">
              {institute.courses.map((course, idx) => (
                <span key={`${course}-${idx}`} className="id-course-pill">
                  {course}
                </span>
              ))}
            </div>
          ) : (
            <p style={{ color: "#64748b", margin: 0 }}>
              No courses listed yet. Click <strong>Edit Profile</strong> to add your offerings.
            </p>
          )}
        </div>
      </main>

      {/* ── Edit Profile Modal ── */}
      {editing && (
        <div className="id-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
          <div className="id-modal">
            <div className="id-modal-header">
              <h2 id="edit-profile-title" className="id-modal-title">Edit Institute Profile</h2>
              <button
                type="button"
                className="id-modal-close"
                onClick={() => setEditing(false)}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="id-modal-body">
                {saveError && (
                  <p className="auth-alert auth-alert--error" style={{ marginBottom: "1.25rem" }}>
                    {saveError}
                  </p>
                )}
                {saveSuccess && (
                  <p className="auth-alert auth-alert--success" style={{ marginBottom: "1.25rem" }}>
                    {saveSuccess}
                  </p>
                )}

                <div className="id-form-grid">
                  <div className="id-form-field">
                    <label htmlFor="edit-name">Institute Name *</label>
                    <input
                      id="edit-name"
                      name="name"
                      type="text"
                      value={editForm.name}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <div className="id-form-field">
                    <label htmlFor="edit-desc">Description *</label>
                    <textarea
                      id="edit-desc"
                      name="description"
                      rows={3}
                      value={editForm.description}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <div className="id-form-grid id-form-grid-2">
                    <div className="id-form-field">
                      <label htmlFor="edit-location">Location *</label>
                      <input
                        id="edit-location"
                        name="location"
                        type="text"
                        value={editForm.location}
                        onChange={handleEditChange}
                        required
                      />
                    </div>

                    <div className="id-form-field">
                      <label htmlFor="edit-phone">Contact Phone</label>
                      <input
                        id="edit-phone"
                        name="contactPhone"
                        type="text"
                        value={editForm.contactPhone}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>

                  <div className="id-form-grid id-form-grid-2">
                    <div className="id-form-field">
                      <label htmlFor="edit-fees">Fees (₹)</label>
                      <input
                        id="edit-fees"
                        name="fees"
                        type="number"
                        min="0"
                        value={editForm.fees}
                        onChange={handleEditChange}
                      />
                    </div>

                    <div className="id-form-field">
                      <label htmlFor="edit-duration">Duration</label>
                      <input
                        id="edit-duration"
                        name="duration"
                        type="text"
                        placeholder="e.g. 6 months"
                        value={editForm.duration}
                        onChange={handleEditChange}
                      />
                    </div>
                  </div>

                  <div className="id-form-field">
                    <label htmlFor="edit-image">Image URL</label>
                    <input
                      id="edit-image"
                      name="image"
                      type="url"
                      placeholder="https://example.com/photo.jpg"
                      value={editForm.image}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="id-form-field">
                    <label>Courses Offered</label>
                    {editForm.courses.map((course, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.4rem" }}>
                        <input
                          type="text"
                          placeholder="e.g. Python Full Stack"
                          value={course}
                          onChange={(e) => handleCourseChange(idx, e.target.value)}
                          style={{ flex: 1 }}
                        />
                        {editForm.courses.length > 1 && (
                          <button
                            type="button"
                            className="id-btn-secondary"
                            onClick={() => removeCourse(idx)}
                            style={{ padding: "0.5rem 0.8rem", color: "#dc2626" }}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      className="id-btn-secondary"
                      onClick={addCourse}
                      style={{ alignSelf: "flex-start", marginTop: "0.3rem" }}
                    >
                      + Add Course
                    </button>
                  </div>
                </div>
              </div>

              <div className="id-modal-footer">
                <button
                  type="button"
                  className="id-btn-secondary"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-institute-profile-btn"
                  className="id-btn-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstituteDashboard;
