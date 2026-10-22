import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import "../styles/Institutes.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ── Small inline SVG icons ── */
const Icon = {
  search: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  location: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M6.5 1C4.567 1 3 2.567 3 4.5c0 2.625 3.5 7.5 3.5 7.5S10 7.125 10 4.5C10 2.567 8.433 1 6.5 1z" stroke="currentColor" strokeWidth="1.4"/>
      <circle cx="6.5" cy="4.5" r="1.25" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  ),
  verified: (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
      <path d="M2 5.5l2.5 2.5L9 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  fees: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6.5 4v5M5 5.25h2.25a1.25 1.25 0 010 2.5H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  ),
  duration: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
      <path d="M6.5 3.5V6.5l2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arrow: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  error: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 7v5M11 14.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  empty: (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 11h6M11 8v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  clear: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M2 2l9 9M11 2L2 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  email: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
};

/* ── Format fees ── */
function formatFees(fees) {
  if (fees == null || fees === "") return null;
  const num = Number(fees);
  if (isNaN(num)) return String(fees);
  if (num === 0) return "Free";
  return `₹${num.toLocaleString("en-IN")}`;
}

/* ── Initials from name ── */
function nameInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/* ═══════════════════════════════════════════════════════
   ExploreInstitutes page
═══════════════════════════════════════════════════════ */
function ExploreInstitutes() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);

  // Filter state
  const [search, setSearch]               = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [verifiedOnly, setVerifiedOnly]   = useState(false);

  /* ── Fetch all institutes ── */
  const fetchInstitutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/institutes`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || `Server responded with ${res.status}`);
      setInstitutes(Array.isArray(data.institutes) ? data.institutes : []);
    } catch (err) {
      setError(err.message || "Failed to load institutes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInstitutes(); }, [fetchInstitutes]);

  /* ── Derive unique courses for filter dropdown ── */
  const allCourses = useMemo(() => {
    const set = new Set();
    institutes.forEach((inst) =>
      (inst.courses || []).forEach((c) => { if (c) set.add(c); })
    );
    return Array.from(set).sort();
  }, [institutes]);

  /* ── Client-side filtering ── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return institutes.filter((inst) => {
      // Search: name or location
      if (q) {
        const inName     = inst.name?.toLowerCase().includes(q);
        const inLocation = inst.location?.toLowerCase().includes(q);
        if (!inName && !inLocation) return false;
      }
      // Course filter
      if (selectedCourse) {
        const hasCourse = (inst.courses || []).some(
          (c) => c.toLowerCase() === selectedCourse.toLowerCase()
        );
        if (!hasCourse) return false;
      }
      // Verified toggle
      if (verifiedOnly && !inst.isVerified) return false;
      return true;
    });
  }, [institutes, search, selectedCourse, verifiedOnly]);

  /* ── Has any active filter ── */
  const hasFilter = search || selectedCourse || verifiedOnly;

  const clearFilters = () => {
    setSearch("");
    setSelectedCourse("");
    setVerifiedOnly(false);
  };

  /* ── Render ── */
  return (
    <div className="inst-page">
      {/* Hero */}
      <div className="inst-hero">
        <div className="inst-hero-inner">
          <span className="inst-hero-badge">
            {Icon.search} Explore
          </span>
          <h1 className="inst-hero-title">
            Find the Right <span>Institute</span>
          </h1>
          <p className="inst-hero-sub">
            Browse verified training institutes, compare courses and fees, and take
            the next step in your learning journey.
          </p>
        </div>
      </div>

      {/* Main */}
      <div className="inst-container">
        {/* Toolbar */}
        <div className="inst-toolbar" role="search" aria-label="Institute filters">
          {/* Search */}
          <div className="inst-search-wrap">
            <span className="inst-search-icon">{Icon.search}</span>
            <input
              id="inst-search-input"
              type="search"
              className="inst-search"
              placeholder="Search by name or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search institutes"
            />
          </div>

          {/* Course filter — only show if there are courses */}
          {allCourses.length > 0 && (
            <select
              id="inst-course-filter"
              className="inst-filter-select"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              aria-label="Filter by course"
            >
              <option value="">All Courses</option>
              {allCourses.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Verified toggle */}
          <button
            type="button"
            id="inst-verified-toggle"
            className={`inst-verified-toggle${verifiedOnly ? " inst-verified-toggle--active" : ""}`}
            onClick={() => setVerifiedOnly((v) => !v)}
            aria-pressed={verifiedOnly}
          >
            {Icon.verified} Verified Only
          </button>

          {/* Clear */}
          {hasFilter && (
            <button
              type="button"
              id="inst-clear-filters"
              className="inst-clear-btn"
              onClick={clearFilters}
            >
              {Icon.clear} Clear
            </button>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="inst-loading" aria-live="polite" aria-busy="true">
            <div className="inst-spinner" role="status" aria-label="Loading…" />
            <p className="inst-loading-text">Loading institutes…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="inst-error" role="alert">
            <div className="inst-error-icon">{Icon.error}</div>
            <p className="inst-error-title">Could not load institutes</p>
            <p className="inst-error-body">{error}</p>
            <button type="button" className="inst-retry-btn" onClick={fetchInstitutes}>
              Retry
            </button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && (
          <>
            {/* Results count */}
            <div className="inst-results-bar">
              <p className="inst-results-count">
                Showing <strong>{filtered.length}</strong>{" "}
                {filtered.length === 1 ? "institute" : "institutes"}
                {institutes.length !== filtered.length && ` of ${institutes.length}`}
              </p>
            </div>

            {/* Empty state */}
            {filtered.length === 0 && (
              <div className="inst-empty">
                <div className="inst-empty-icon">{Icon.empty}</div>
                {institutes.length === 0 ? (
                  <>
                    <p className="inst-empty-title">No institutes registered yet</p>
                    <p className="inst-empty-body">
                      Institutes will appear here once they register on EduFind.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="inst-empty-title">No results match your filters</p>
                    <p className="inst-empty-body">
                      Try adjusting your search term or removing filters.
                    </p>
                    <button type="button" className="inst-retry-btn" onClick={clearFilters}>
                      Clear Filters
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Grid */}
            {filtered.length > 0 && (
              <div className="inst-grid">
                {filtered.map((inst) => (
                  <InstituteCard key={inst._id} inst={inst} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Single institute card ── */
function InstituteCard({ inst }) {
  const {
    _id, name, description, location, courses = [],
    fees, duration, contactEmail, image, isVerified,
  } = inst;

  const displayCourses = courses.slice(0, 3);
  const extraCount     = courses.length - displayCourses.length;
  const feesLabel      = formatFees(fees);
  const initials       = nameInitials(name);
  const API_URL        = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Resolve image URL — handles relative server paths and absolute URLs
  const imgSrc = image
    ? image.startsWith("http") ? image : `${API_URL}/${image.replace(/^\//, "")}`
    : null;

  return (
    <article className="inst-card" aria-label={name}>
      {/* Image */}
      <div className="inst-card-img-wrap">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={name}
            className="inst-card-img"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <div
          className="inst-card-img-placeholder"
          style={{ display: imgSrc ? "none" : "flex" }}
          aria-hidden="true"
        >
          {initials}
        </div>
        {isVerified && (
          <span className="inst-verified-badge">
            {Icon.verified} Verified
          </span>
        )}
      </div>

      {/* Body */}
      <div className="inst-card-body">
        <h2 className="inst-card-name">{name}</h2>

        {location && (
          <span className="inst-card-location">
            {Icon.location} {location}
          </span>
        )}

        {description && (
          <p className="inst-card-desc">{description}</p>
        )}

        {/* Courses */}
        {courses.length > 0 && (
          <div className="inst-courses-wrap" aria-label="Courses offered">
            {displayCourses.map((c) => (
              <span key={c} className="inst-course-pill">{c}</span>
            ))}
            {extraCount > 0 && (
              <span className="inst-course-pill inst-course-pill--more">
                +{extraCount} more
              </span>
            )}
          </div>
        )}

        {/* Meta */}
        <div className="inst-card-meta">
          {feesLabel && (
            <span className="inst-meta-item">
              {Icon.fees}
              <strong>{feesLabel}</strong>
            </span>
          )}
          {duration && (
            <span className="inst-meta-item">
              {Icon.duration}
              <strong>{duration}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="inst-card-footer">
        <span className="inst-contact-hint">
          {contactEmail || ""}
        </span>
        <Link
          to={`/institutes/${_id}`}
          className="inst-view-btn"
          id={`inst-view-${_id}`}
          aria-label={`View details for ${name}`}
        >
          View Details {Icon.arrow}
        </Link>
      </div>
    </article>
  );
}

export default ExploreInstitutes;
