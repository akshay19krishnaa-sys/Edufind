import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useInstituteAuth } from "../context/InstituteAuthContext";
import "./Navbar.css";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/institutes", label: "Explore Institutes" },
  { to: "/courses", label: "Online Courses" },
];

const DEFAULT_INSTITUTE_LINKS = [
  { to: "/institute/login", label: "Institute Login" },
  { to: "/institute/register", label: "Register Institute" },
];

function Navbar() {
  const { isAuthenticated } = useAuth();
  const { isAuthenticated: isInstituteAuth } = useInstituteAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [instituteOpen, setInstituteOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();

  const instituteLinks = isInstituteAuth
    ? [
        { to: "/institute/dashboard", label: "Institute Dashboard" },
        { to: "/institute/login", label: "Switch Account" },
      ]
    : DEFAULT_INSTITUTE_LINKS;

  const closeMenu = () => {
    setMenuOpen(false);
    setInstituteOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setInstituteOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      <header className="site-navbar">
        <nav className="navbar-inner">
          {/* ── Brand ── */}
          <Link to="/" className="navbar-brand" onClick={closeMenu} aria-label="EduFind">
            <img
              src="/images/edufind-logo-clean.png"
              alt="EduFind"
              className="navbar-brand-logo"
            />
          </Link>

          {/* ── Desktop nav links ── */}
          <div className="navbar-links">
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `navbar-link${isActive ? " navbar-link--active" : ""}`
                }
              >
                {label}
              </NavLink>
            ))}

            {/* Institute dropdown */}
            <div className="navbar-dropdown" ref={dropdownRef}>
              <button
                type="button"
                className={`navbar-link navbar-dropdown-trigger${
                  instituteOpen ? " navbar-link--active" : ""
                }`}
                onClick={() => setInstituteOpen((prev) => !prev)}
                aria-expanded={instituteOpen}
                aria-haspopup="true"
              >
                For Institutes
                <svg
                  className={`navbar-chevron${instituteOpen ? " navbar-chevron--open" : ""}`}
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M2 4l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {instituteOpen && (
                <div className="navbar-dropdown-menu" role="menu">
                  {instituteLinks.map(({ to, label }) => (
                    <Link
                      key={to}
                      to={to}
                      className="navbar-dropdown-item"
                      role="menuitem"
                      onClick={() => setInstituteOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Desktop auth buttons ── */}
          <div className="navbar-actions">
            {isAuthenticated ? (
              <Link
                to="/student/dashboard"
                className="navbar-btn navbar-btn--solid"
                id="nav-dashboard-btn"
              >
                Dashboard
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            ) : (
              <>
                <Link to="/login" className="navbar-btn navbar-btn--ghost">
                  Student Login
                </Link>
                <Link to="/register" className="navbar-btn navbar-btn--solid">
                  Get Started
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3 7h8M7.5 3.5L11 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Link>
              </>
            )}
          </div>

          {/* ── Hamburger (mobile only) ── */}
          <button
            type="button"
            className={`navbar-hamburger${menuOpen ? " navbar-hamburger--open" : ""}`}
            aria-expanded={menuOpen}
            aria-controls="mobile-drawer"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </button>
        </nav>
      </header>

      {/* ── Mobile backdrop ── */}
      <div
        className={`navbar-backdrop${menuOpen ? " navbar-backdrop--visible" : ""}`}
        aria-hidden="true"
        onClick={closeMenu}
      />

      {/* ── Mobile drawer ── */}
      <div
        id="mobile-drawer"
        className={`navbar-drawer${menuOpen ? " navbar-drawer--open" : ""}`}
        role="dialog"
        aria-label="Navigation menu"
      >
        <div className="drawer-inner">
          <p className="drawer-section-label">Navigation</p>
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `drawer-link${isActive ? " drawer-link--active" : ""}`
              }
              onClick={closeMenu}
            >
              {label}
            </NavLink>
          ))}

          <p className="drawer-section-label drawer-section-label--spaced">For Institutes</p>
          {instituteLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="drawer-link drawer-link--institute"
              onClick={closeMenu}
            >
              {label}
            </Link>
          ))}

          <div className="drawer-auth">
            {isAuthenticated ? (
              <Link
                to="/student/dashboard"
                className="navbar-btn navbar-btn--solid drawer-auth-btn"
                id="drawer-dashboard-btn"
                onClick={closeMenu}
              >
                Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/login" className="navbar-btn navbar-btn--ghost drawer-auth-btn" onClick={closeMenu}>
                  Student Login
                </Link>
                <Link to="/register" className="navbar-btn navbar-btn--solid drawer-auth-btn" onClick={closeMenu}>
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;

