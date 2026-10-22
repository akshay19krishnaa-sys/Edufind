import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/Institutes.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ── Inline SVG icons ── */
const Icon = {
  back: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  location: (
    <svg width="15" height="15" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M6.5 1C4.567 1 3 2.567 3 4.5c0 2.625 3.5 7.5 3.5 7.5S10 7.125 10 4.5C10 2.567 8.433 1 6.5 1z" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="6.5" cy="4.5" r="1.25" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  verified: (
    <svg width="13" height="13" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path d="M2 5.5l2.5 2.5L9 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  fees: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 5v6M6 6.5h3a1.5 1.5 0 010 3H6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  duration: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M8 4.5V8l2.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  email: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M2 5l6 4 6-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  phone: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M10 13c-4.4 0-8-3.6-8-8 0-.5.4-.9.9-1.3l1.2-.8c.4-.3.9-.1 1.1.3l.8 1.8c.2.4 0 .9-.4 1.1l-.6.4c.5 1.3 1.5 2.3 2.8 2.8l.4-.6c.3-.4.8-.6 1.1-.4l1.8.8c.4.2.6.7.3 1.1l-.8 1.2c-.4.5-.8.9-1.3.9-.1-.3-.3-.3-.3-.3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  info: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M10 9v5M10 6.5v.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  error: (
    <svg width="24" height="24" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 7v5M11 14.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
};

/* ── Format fees ── */
function formatFees(fees) {
  if (fees == null || fees === "") return "Contact for fees";
  const num = Number(fees);
  if (isNaN(num)) return String(fees);
  if (num === 0) return "Free";
  return `₹${num.toLocaleString("en-IN")}`;
}

/* ── Initials ── */
function nameInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

function InstituteDetail() {
  const { id } = useParams();
  const [institute, setInstitute] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [is404, setIs404]         = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) {
      setError("No institute ID provided");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setIs404(false);

    try {
      const res = await fetch(`${API_BASE}/api/institutes/${id}`);
      const data = await res.json().catch(() => ({}));

      if (res.status === 404) {
        setIs404(true);
        setError(data.message || "Institute not found");
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || `Server responded with ${res.status}`);
      }

      if (!data.institute) {
        throw new Error("Invalid response format from server");
      }

      setInstitute(data.institute);
    } catch (err) {
      setError(err.message || "Failed to load institute details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div className="idet-page">
        <div className="idet-container">
          <Link to="/institutes" className="idet-back">
            {Icon.back} Back to Institutes
          </Link>
          <div className="idet-loading" aria-live="polite" aria-busy="true">
            <div className="inst-spinner" role="status" aria-label="Loading institute details…" />
            <p className="inst-loading-text">Loading institute details…</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error / Not found state ── */
  if (error || !institute) {
    return (
      <div className="idet-page">
        <div className="idet-container">
          <Link to="/institutes" className="idet-back">
            {Icon.back} Back to Institutes
          </Link>
          <div className="idet-error" role="alert">
            <div className="inst-error-icon">{Icon.error}</div>
            <h1 className="inst-error-title">
              {is404 ? "Institute Not Found" : "Unable to Load Institute"}
            </h1>
            <p className="inst-error-body">
              {is404
                ? "The institute you are looking for does not exist or may have been removed."
                : error}
            </p>
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
              <button type="button" className="inst-retry-btn" onClick={fetchDetail}>
                Try Again
              </button>
              <Link to="/institutes" className="inst-view-btn">
                Browse All Institutes
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    name,
    description,
    location,
    courses = [],
    fees,
    duration,
    contactEmail,
    contactPhone,
    image,
    isVerified,
  } = institute;

  const feesLabel = formatFees(fees);
  const initials  = nameInitials(name);
  const imgSrc    = image
    ? image.startsWith("http")
      ? image
      : `${API_BASE}/${image.replace(/^\//, "")}`
    : null;

  return (
    <div className="idet-page">
      <div className="idet-container">
        {/* Navigation Breadcrumb */}
        <Link to="/institutes" className="idet-back" id="back-to-institutes-link">
          {Icon.back} Back to Institutes
        </Link>

        {/* Hero image or banner */}
        <div className="idet-hero-img-wrap">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={name}
              className="idet-hero-img"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const placeholder = e.currentTarget.parentElement?.querySelector(".idet-hero-placeholder");
                if (placeholder) placeholder.style.display = "flex";
              }}
            />
          ) : null}

          <div
            className="idet-hero-placeholder"
            style={{ display: imgSrc ? "none" : "flex" }}
            aria-hidden="true"
          >
            {initials}
          </div>

          {isVerified && (
            <span className="idet-verified-overlay">
              {Icon.verified} Verified
            </span>
          )}
        </div>

        {/* Main profile card */}
        <article className="idet-card">
          {/* Header */}
          <div className="idet-card-head">
            <h1 className="idet-name">{name}</h1>
            {location && (
              <span className="idet-location">
                {Icon.location} {location}
              </span>
            )}
          </div>

          {/* Quick info row */}
          <div className="idet-info-grid">
            <div className="idet-info-item">
              <p className="idet-info-label">Estimated Fees</p>
              <p className="idet-info-value">{feesLabel}</p>
            </div>
            <div className="idet-info-item">
              <p className="idet-info-label">Program Duration</p>
              <p className="idet-info-value">{duration || "Flexible"}</p>
            </div>
            <div className="idet-info-item">
              <p className="idet-info-label">Verification</p>
              <p className="idet-info-value">
                {isVerified ? "Verified Partner" : "Pending Verification"}
              </p>
            </div>
            <div className="idet-info-item">
              <p className="idet-info-label">Courses Offered</p>
              <p className="idet-info-value">
                {courses.length} {courses.length === 1 ? "Program" : "Programs"}
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="idet-body">
            {/* Unverified note if applicable */}
            {!isVerified && (
              <div className="idet-unverified-notice" role="note">
                {Icon.info}
                <div>
                  <strong>Profile Pending Verification:</strong> This institute is newly
                  registered. Information and courses are self-reported by the institute.
                </div>
              </div>
            )}

            {/* About */}
            <section aria-labelledby="idet-about-title">
              <h2 id="idet-about-title" className="idet-section-title">
                About the Institute
              </h2>
              <p className="idet-description">
                {description || "No description provided by the institute."}
              </p>
            </section>

            {/* Courses */}
            {courses.length > 0 && (
              <section aria-labelledby="idet-courses-title">
                <h2 id="idet-courses-title" className="idet-section-title">
                  Courses &amp; Programs
                </h2>
                <div className="idet-courses-grid">
                  {courses.map((course, idx) => (
                    <span key={`${course}-${idx}`} className="idet-course-pill">
                      {course}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Contact Information */}
            {(contactEmail || contactPhone) && (
              <section aria-labelledby="idet-contact-title">
                <h2 id="idet-contact-title" className="idet-section-title">
                  Contact Information
                </h2>
                <div className="idet-contact-row">
                  {contactEmail && (
                    <div className="idet-contact-item">
                      {Icon.email}
                      <a href={`mailto:${contactEmail}`} aria-label={`Email ${name}`}>
                        {contactEmail}
                      </a>
                    </div>
                  )}
                  {contactPhone && (
                    <div className="idet-contact-item">
                      {Icon.phone}
                      <a href={`tel:${contactPhone}`} aria-label={`Call ${name}`}>
                        {contactPhone}
                      </a>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

export default InstituteDetail;
