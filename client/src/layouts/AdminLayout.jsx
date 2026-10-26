import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";
import { AdminUIProvider, useAdminUI } from "../context/AdminUIContext";
import "../styles/Admin.css";

const NAV_GROUPS = [
  {
    title: "Overview",
    items: [
      {
        path: "/admin/dashboard",
        label: "Dashboard",
        icon: (
          <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Platform Entities",
    items: [
      {
        path: "/admin/users",
        label: "Users Management",
        icon: (
          <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      },
      {
        path: "/admin/institutes",
        label: "Institutes & Verification",
        icon: (
          <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
      },
      {
        path: "/admin/courses",
        label: "Course Moderation",
        icon: (
          <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        ),
      },
      {
        path: "/admin/applications",
        label: "Applications & Admissions",
        icon: (
          <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "Operations & Moderation",
    items: [
      {
        path: "/admin/moderation",
        label: "Content Moderation",
        icon: (
          <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
      },
      {
        path: "/admin/featured-institutes",
        label: "Featured Institutes",
        icon: (
          <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ),
      },
      {
        path: "/admin/transactions",
        label: "Transactions & Payments",
        icon: (
          <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        ),
      },
    ],
  },
  {
    title: "System & Governance",
    items: [
      {
        path: "/admin/analytics",
        label: "Reports & Analytics",
        icon: (
          <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
      {
        path: "/admin/settings",
        label: "Platform Settings",
        icon: (
          <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        path: "/admin/audit-logs",
        label: "Audit Logs",
        icon: (
          <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ],
  },
];

function AdminLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { admin, logout } = useAdminAuth();
  const { confirmAction } = useAdminUI();
  const location = useLocation();
  const navigate = useNavigate();

  // Find active label for breadcrumbs
  let currentTitle = "Dashboard";
  for (const group of NAV_GROUPS) {
    const item = group.items.find((i) => i.path === location.pathname);
    if (item) {
      currentTitle = item.label;
      break;
    }
  }

  const handleLogout = () => {
    confirmAction({
      title: "Confirm Admin Logout",
      message: "Are you sure you want to end your administrator session?",
      confirmText: "Log Out",
      isDanger: true,
      onConfirm: () => {
        logout();
        navigate("/admin/login", { replace: true });
      },
    });
  };

  return (
    <div className="admin-shell">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? "admin-sidebar--open" : ""}`}>
        <div className="admin-sidebar-header">
          <Link to="/admin/dashboard" className="admin-brand" onClick={() => setSidebarOpen(false)}>
            <img src="/logo.png" alt="EduFind" className="admin-brand-logo" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <span style={{ fontWeight: 800, fontSize: "1.2rem", color: "#173b5e", letterSpacing: "-0.02em" }}>
              EduFind
            </span>
            <span className="admin-brand-badge">ADMIN</span>
          </Link>

          <button
            type="button"
            className="lg:hidden p-1 text-slate-400 hover:text-slate-600 rounded"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_GROUPS.map((group, idx) => (
            <div key={idx} style={{ marginBottom: "0.5rem" }}>
              <div className="admin-nav-group-title">{group.title}</div>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `admin-nav-item ${isActive ? "admin-nav-item--active" : ""}`
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", overflow: "hidden" }}>
            <div className="admin-avatar">
              {(admin?.name || admin?.email || "A").charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {admin?.name || "Administrator"}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748b", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                {admin?.email || "admin@edufind.com"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="admin-main-wrapper">
        {/* Admin Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="admin-breadcrumbs">
              <span>Admin</span>
              <span>/</span>
              <span className="admin-breadcrumbs-current">{currentTitle}</span>
            </div>
          </div>

          <div className="admin-topbar-right">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn-secondary admin-btn-sm"
              title="Open public portal in a new tab"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Public Portal</span>
            </a>

            <div className="admin-user-menu">
              <div className="admin-user-info hidden sm:flex">
                <span className="admin-user-name">{admin?.name || "Admin"}</span>
                <span className="admin-user-role">
                  {admin?.isSuperAdmin ? "Super Administrator" : "Platform Moderator"}
                </span>
              </div>

              <button
                type="button"
                className="admin-logout-btn"
                onClick={handleLogout}
                title="Log out from admin"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminUIProvider>
      <AdminLayoutInner />
    </AdminUIProvider>
  );
}
