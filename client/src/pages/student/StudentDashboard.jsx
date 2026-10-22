import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/StudentDashboard.css";

/* ── Tiny inline SVG icons (no external dependency) ── */
const Icon = {
  menu: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  close: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  home: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M1.5 7L8 1.5 14.5 7V14.5H10V10H6v4.5H1.5V7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  ),
  explore: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10.5 5.5L7 9M5.5 10.5l1.5-1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10.5 5.5L9 7M5.5 10.5L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  compare: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="3" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9.5" y="3" width="5" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M7 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  courses: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="1.5" y="2" width="13" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M6 14h4M8 11v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  applications: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="1.5" width="11" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 5.5h6M5 8h6M5 10.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  enrolled: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2.5 14c0-3.038 2.462-5.5 5.5-5.5s5.5 2.462 5.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10 11.5l1.5 1.5 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  profile: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="5.5" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 14c0-3.038 2.686-5.5 6-5.5s6 2.462 6 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  logout: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M6 2H2.5A1.5 1.5 0 001 3.5v9A1.5 1.5 0 002.5 14H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10.5 11l3.5-3-3.5-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  email: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M1 4l6 4 6-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  phone: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M9.5 12.5c-4.4 0-8-3.6-8-8 0-.5.4-.9.9-1.3l1.2-.8c.4-.3.9-.1 1.1.3l.8 1.8c.2.4 0 .9-.4 1.1l-.6.4c.5 1.3 1.5 2.3 2.8 2.8l.4-.6c.3-.4.8-.6 1.1-.4l1.8.8c.4.2.6.7.3 1.1l-.8 1.2c-.4.5-.8.9-1.3.9-.1-.3-.3-.3-.3-.3z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  ),
  gender: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M9 2l2-2M11 0h-2M11 0v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  qualification: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1L13 4.5l-6 3.5L1 4.5 7 1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M4 6.5V10c1 1 5 1 6 0V6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  arrow: (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
      <path d="M2.5 6.5h8M7 3l3.5 3.5L7 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

/* ── Utility: first letter uppercase ── */
function initials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/* ── Sidebar nav items definition ── */
const NAV_ITEMS = [
  {
    group: "Discover",
    items: [
      { id: "overview",     label: "Overview",             icon: "home",         type: "section" },
      { id: "institutes",   label: "Explore Institutes",   icon: "explore",      href: "/institutes" },
      { id: "compare",      label: "Compare Institutes",   icon: "compare",      href: "/compare" },
      { id: "courses",      label: "Online Courses",       icon: "courses",      href: "/courses" },
    ],
  },
  {
    group: "My Activity",
    items: [
      { id: "applications", label: "My Applications",      icon: "applications", type: "section" },
      { id: "enrolled",     label: "My Enrolled Courses",  icon: "enrolled",     type: "section" },
    ],
  },
  {
    group: "Account",
    items: [
      { id: "profile",      label: "My Profile",           icon: "profile",      type: "section" },
    ],
  },
];

/* ── Quick-action cards for the main content area ── */
const QUICK_CARDS = [
  {
    id: "institutes",
    title: "Explore Institutes",
    desc: "Browse and discover top-rated institutes near you.",
    icon: "explore",
    color: "teal",
    href: "/institutes",
    cta: "Browse now",
    available: true,
  },
  {
    id: "compare",
    title: "Compare Institutes",
    desc: "Side-by-side comparison of fees, courses & ratings.",
    icon: "compare",
    color: "blue",
    href: "/compare",
    cta: "Compare",
    available: false,
  },
  {
    id: "courses",
    title: "Online Courses",
    desc: "Explore professional online courses & certifications.",
    icon: "courses",
    color: "amber",
    href: "/courses",
    cta: "Explore",
    available: false,
  },
  {
    id: "applications",
    title: "My Applications",
    desc: "Track the status of your institute applications.",
    icon: "applications",
    color: "violet",
    section: "applications",
    cta: "View",
    available: false,
  },
  {
    id: "enrolled",
    title: "Enrolled Courses",
    desc: "Resume your ongoing online learning journeys.",
    icon: "enrolled",
    color: "green",
    section: "enrolled",
    cta: "View",
    available: false,
  },
  {
    id: "profile",
    title: "My Profile",
    desc: "Update your personal details and preferences.",
    icon: "profile",
    color: "rose",
    section: "profile",
    cta: "Edit",
    available: false,
  },
];

/* ══════════════════════════════════════════════════════
   StudentDashboard
══════════════════════════════════════════════════════ */
function StudentDashboard() {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleNavClick = (item) => {
    setSidebarOpen(false);
    if (item.href) {
      navigate(item.href);
    } else if (item.type === "section") {
      setActiveSection(item.id);
    }
  };

  const handleCardClick = (card) => {
    if (card.href) {
      navigate(card.href);
    } else if (card.section) {
      setActiveSection(card.section);
    }
  };

  const studentName  = student?.name  || "Student";
  const studentEmail = student?.email || "";
  const avatarText   = initials(studentName);

  /* ── Sidebar JSX ── */
  const Sidebar = (
    <aside className={`sd-sidebar${sidebarOpen ? " sd-sidebar--open" : ""}`} aria-label="Dashboard navigation">
      {/* Header */}
      <div className="sd-sidebar-header">
        <Link to="/" className="sd-brand" onClick={() => setSidebarOpen(false)} aria-label="EduFind Home">
          <span className="sd-brand-pill">
            <img
              src="/images/edufind-logo-clean.png"
              alt="EduFind"
              className="sd-brand-logo"
            />
          </span>
        </Link>
        <button
          type="button"
          className="sd-sidebar-close"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        >
          {Icon.close}
        </button>
      </div>

      {/* Profile mini */}
      <div className="sd-profile-mini">
        <div className="sd-avatar">{avatarText}</div>
        <p className="sd-profile-name">{studentName}</p>
        <p className="sd-profile-email">{studentEmail}</p>
      </div>

      {/* Navigation */}
      <nav className="sd-nav">
        {NAV_ITEMS.map(({ group, items }) => (
          <div key={group}>
            <p className="sd-nav-label">{group}</p>
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`sd-nav-item${activeSection === item.id ? " sd-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item)}
              >
                <span className="sd-nav-icon">{Icon[item.icon]}</span>
                {item.label}
                {!item.available && item.type === "section" && item.id !== "overview" && item.id !== "profile" && (
                  <span className="sd-nav-badge">Soon</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="sd-sidebar-footer">
        <button
          type="button"
          className="sd-nav-item sd-nav-item--logout"
          onClick={handleLogout}
          id="student-logout-btn"
        >
          <span className="sd-nav-icon">{Icon.logout}</span>
          Logout
        </button>
      </div>
    </aside>
  );

  /* ── Section content ── */
  const renderSection = () => {
    switch (activeSection) {
      case "applications":
        return <EmptySection
          icon="applications"
          title="No Applications Yet"
          body="You haven't applied to any institutes yet. Start exploring institutes and submit your first application."
          actionLabel="Explore Institutes"
          actionHref="/institutes"
        />;
      case "enrolled":
        return <EmptySection
          icon="enrolled"
          title="No Enrolled Courses"
          body="You haven't enrolled in any online courses yet. Browse our catalogue to find courses that match your goals."
          actionLabel="Browse Courses"
          actionHref="/courses"
        />;
      case "profile":
        return <ProfileSection student={student} />;
      default:
        return <OverviewSection student={student} onCardClick={handleCardClick} />;
    }
  };

  return (
    <div className="sd-shell">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="sd-backdrop sd-backdrop--visible"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      {Sidebar}

      {/* Main */}
      <div className="sd-main">
        {/* Topbar */}
        <header className="sd-topbar">
          <div className="sd-topbar-left">
            <button
              type="button"
              className="sd-menu-btn"
              aria-label="Open menu"
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen(true)}
            >
              {Icon.menu}
            </button>
            <span className="sd-topbar-title">Student Dashboard</span>
          </div>
          <div className="sd-topbar-right">
            <div className="sd-topbar-avatar" aria-hidden="true">{avatarText}</div>
          </div>
        </header>

        {/* Content */}
        <main className="sd-content">
          {renderSection()}
        </main>
      </div>
    </div>
  );
}

/* ── Overview section ── */
function OverviewSection({ student, onCardClick }) {
  const studentName = student?.name || "Student";
  const firstName   = studentName.split(" ")[0];

  return (
    <>
      {/* Welcome */}
      <div className="sd-welcome">
        <h1 className="sd-welcome-greeting">
          Welcome back, <span>{firstName}</span> 👋
        </h1>
        <p className="sd-welcome-sub">
          Here's an overview of your EduFind activity.
        </p>
      </div>

      {/* Stats */}
      <div className="sd-stats-row">
        <div className="sd-stat-card">
          <p className="sd-stat-number">0</p>
          <p className="sd-stat-label">Applications</p>
        </div>
        <div className="sd-stat-card">
          <p className="sd-stat-number">0</p>
          <p className="sd-stat-label">Enrolled Courses</p>
        </div>
        <div className="sd-stat-card">
          <p className="sd-stat-number">0</p>
          <p className="sd-stat-label">Saved Institutes</p>
        </div>
        <div className="sd-stat-card">
          <p className="sd-stat-number">0</p>
          <p className="sd-stat-label">Comparisons</p>
        </div>
      </div>

      {/* Profile summary */}
      <div className="sd-section-header">
        <h2 className="sd-section-title">Profile Summary</h2>
        <div className="sd-section-divider" />
      </div>
      <ProfileCard student={student} />

      {/* Quick actions */}
      <div className="sd-section-header">
        <h2 className="sd-section-title">Quick Actions</h2>
        <div className="sd-section-divider" />
      </div>
      <div className="sd-cards-grid">
        {QUICK_CARDS.map((card) => (
          <button
            key={card.id}
            type="button"
            className={`sd-card sd-card--${card.color}`}
            onClick={() => onCardClick(card)}
            id={`dashboard-card-${card.id}`}
          >
            <div className="sd-card-icon-wrap">{Icon[card.icon]}</div>
            <p className="sd-card-title">{card.title}</p>
            <p className="sd-card-desc">{card.desc}</p>
            <span className="sd-card-arrow">
              {card.cta} {Icon.arrow}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

/* ── Profile card (summary) ── */
function ProfileCard({ student }) {
  if (!student) return null;
  const { name, email, phone, gender, qualification } = student;
  const av = initials(name || "");

  return (
    <div className="sd-profile-card">
      <div className="sd-profile-card-avatar">{av}</div>
      <div className="sd-profile-card-info">
        <h3 className="sd-profile-card-name">{name}</h3>
        <span className="sd-profile-card-role">Student</span>
        <div className="sd-profile-card-meta">
          {email && (
            <span className="sd-meta-item">
              {Icon.email}
              <strong>{email}</strong>
            </span>
          )}
          {phone && (
            <span className="sd-meta-item">
              {Icon.phone}
              <strong>{phone}</strong>
            </span>
          )}
          {gender && (
            <span className="sd-meta-item">
              {Icon.gender}
              <strong>{gender}</strong>
            </span>
          )}
          {qualification && (
            <span className="sd-meta-item">
              {Icon.qualification}
              <strong>{qualification}</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Profile section (full page) ── */
function ProfileSection({ student }) {
  if (!student) return null;
  return (
    <>
      <div className="sd-welcome">
        <h1 className="sd-welcome-greeting">My <span>Profile</span></h1>
        <p className="sd-welcome-sub">Your account details registered with EduFind.</p>
      </div>
      <ProfileCard student={student} />
      <div className="sd-empty">
        <div className="sd-empty-icon">{Icon.profile}</div>
        <p className="sd-empty-title">Profile Editing Coming Soon</p>
        <p className="sd-empty-body">
          Editing your profile details is not yet available. Your information shown above is from your registration.
        </p>
      </div>
    </>
  );
}

/* ── Generic empty section ── */
function EmptySection({ icon, title, body, actionLabel, actionHref }) {
  return (
    <>
      <div className="sd-welcome">
        <h1 className="sd-welcome-greeting">{title}</h1>
        <p className="sd-welcome-sub">{body}</p>
      </div>
      <div className="sd-empty">
        <div className="sd-empty-icon">{Icon[icon]}</div>
        <p className="sd-empty-title">{title}</p>
        <p className="sd-empty-body">{body}</p>
        {actionLabel && actionHref && (
          <Link to={actionHref} className="sd-empty-action">
            {actionLabel} {Icon.arrow}
          </Link>
        )}
      </div>
    </>
  );
}

export default StudentDashboard;
