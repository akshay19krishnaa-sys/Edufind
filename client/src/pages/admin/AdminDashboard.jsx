import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminFetch } from "../../services/adminApi";
import { useAdminUI } from "../../context/AdminUIContext";

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useAdminUI();

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/dashboard/metrics");
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to fetch platform metrics");
      }
      setMetrics(data.metrics);
    } catch (err) {
      setError(err.message);
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#64748b" }}>
        <div style={{ display: "inline-block", width: "2.5rem", height: "2.5rem", border: "3px solid #cbd5e1", borderTopColor: "#086d7d", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ marginTop: "1rem", fontWeight: 600 }}>Gathering live platform telemetry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-card" style={{ textAlign: "center", padding: "3rem 1.5rem" }}>
        <h3 style={{ color: "#be123c", margin: "0 0 0.5rem" }}>Unable to load dashboard metrics</h3>
        <p style={{ color: "#64748b", margin: "0 0 1.5rem" }}>{error}</p>
        <button type="button" className="admin-btn admin-btn-primary" onClick={fetchMetrics}>
          Retry Connection
        </button>
      </div>
    );
  }

  const {
    students = {},
    institutes = {},
    courses = {},
    applications = {},
    payments = {},
    moderation = {},
    recentActivity = {},
  } = metrics || {};

  return (
    <div>
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Executive Control Center</h1>
          <p className="admin-page-sub">
            Real-time platform metrics, registrations, verification queues, and financial records.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            onClick={fetchMetrics}
            title="Refresh Metrics"
          >
            <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="admin-metrics-grid">
        {/* Total Students */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-label">Students</span>
            <div className="admin-card-icon" style={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}>
              <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="admin-card-value">{students.total || 0}</div>
          <div className="admin-card-footer">
            <span style={{ color: "#15803d", fontWeight: 700 }}>{students.active || 0} active</span>
            <span>•</span>
            <span style={{ color: students.suspended ? "#be123c" : "#64748b" }}>{students.suspended || 0} suspended</span>
          </div>
        </div>

        {/* Total Institutes */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-label">Institutes</span>
            <div className="admin-card-icon" style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>
              <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="admin-card-value">{institutes.total || 0}</div>
          <div className="admin-card-footer">
            <span style={{ color: "#15803d", fontWeight: 700 }}>{institutes.verified || 0} verified</span>
            <span>•</span>
            <span style={{ color: institutes.pending ? "#d97706" : "#64748b", fontWeight: institutes.pending ? 700 : 400 }}>
              {institutes.pending || 0} pending
            </span>
          </div>
        </div>

        {/* Total Courses */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-label">Courses</span>
            <div className="admin-card-icon" style={{ backgroundColor: "#f3e8ff", color: "#7e22ce" }}>
              <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <div className="admin-card-value">{courses.total || 0}</div>
          <div className="admin-card-footer">
            <span style={{ color: "#15803d" }}>{courses.published || 0} published</span>
            <span>•</span>
            <span>{courses.pending || 0} in review</span>
          </div>
        </div>

        {/* Total Applications */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-label">Applications</span>
            <div className="admin-card-icon" style={{ backgroundColor: "#fef3c7", color: "#b45309" }}>
              <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="admin-card-value">{applications.total || 0}</div>
          <div className="admin-card-footer">
            <span style={{ color: "#d97706", fontWeight: 700 }}>{applications.pending || 0} pending review</span>
            <span>•</span>
            <span style={{ color: "#15803d" }}>{applications.accepted || 0} accepted</span>
          </div>
        </div>

        {/* Verified Platform Revenue */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-label">Platform Revenue</span>
            <div className="admin-card-icon" style={{ backgroundColor: "#ecfdf5", color: "#059669" }}>
              <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="admin-card-value">₹{(payments.revenue || 0).toLocaleString()}</div>
          <div className="admin-card-footer">
            <span>{payments.successful || 0} verified transactions</span>
            {payments.total === 0 && <span style={{ color: "#94a3b8" }}>(No live gateway)</span>}
          </div>
        </div>

        {/* Content Moderation Queue */}
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-label">Moderation Alerts</span>
            <div
              className="admin-card-icon"
              style={{
                backgroundColor: moderation.pending > 0 ? "#ffe4e6" : "#f1f5f9",
                color: moderation.pending > 0 ? "#be123c" : "#64748b",
              }}
            >
              <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="admin-card-value">{moderation.pending || 0}</div>
          <div className="admin-card-footer">
            <span style={{ color: moderation.pending > 0 ? "#be123c" : "#64748b", fontWeight: 700 }}>
              {moderation.pending || 0} pending reports
            </span>
            <span>•</span>
            <span>{moderation.resolved || 0} resolved</span>
          </div>
        </div>
      </div>

      {/* Action Banners if items need urgent attention */}
      {(institutes.pending > 0 || applications.pending > 0 || moderation.pending > 0) && (
        <div
          style={{
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "0.75rem",
            padding: "1rem 1.25rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.25rem" }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: "#92400e", fontSize: "0.9rem" }}>
                Action Items Awaiting Administrative Review
              </div>
              <div style={{ fontSize: "0.825rem", color: "#b45309" }}>
                {[
                  institutes.pending > 0 && `${institutes.pending} institute(s) pending verification`,
                  applications.pending > 0 && `${applications.pending} student application(s) pending`,
                  moderation.pending > 0 && `${moderation.pending} flagged content report(s)`,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {institutes.pending > 0 && (
              <Link to="/admin/institutes?status=pending" className="admin-btn admin-btn-sm admin-btn-primary">
                Review Institutes
              </Link>
            )}
            {moderation.pending > 0 && (
              <Link to="/admin/moderation" className="admin-btn admin-btn-sm admin-btn-danger">
                Review Moderation
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Two-Column Recent Activity Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(28rem, 1fr))", gap: "1.5rem" }}>
        {/* Recent Applications */}
        <div className="admin-table-container">
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Recent Applications</h3>
            <Link to="/admin/applications" className="admin-btn admin-btn-secondary admin-btn-sm">
              View All
            </Link>
          </div>
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Institute</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.applications && recentActivity.applications.length > 0 ? (
                  recentActivity.applications.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{app.student?.name || "Student"}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{app.student?.email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{app.institute?.name || "Institute"}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{app.courseName || "General"}</div>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            app.status === "accepted"
                              ? "admin-badge--green"
                              : app.status === "rejected"
                              ? "admin-badge--red"
                              : "admin-badge--yellow"
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                      No admission applications recorded yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="admin-table-container">
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>Recent Registrations</h3>
            <Link to="/admin/users" className="admin-btn admin-btn-secondary admin-btn-sm">
              Manage Users
            </Link>
          </div>
          <div className="admin-table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.registrations && recentActivity.registrations.length > 0 ? (
                  recentActivity.registrations.map((user) => (
                    <tr key={user._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{user.name}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{user.email}</div>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            user.type === "institute" ? "admin-badge--blue" : "admin-badge--purple"
                          }`}
                        >
                          {user.type}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            user.status === "verified" || user.status === "active"
                              ? "admin-badge--green"
                              : user.status === "pending"
                              ? "admin-badge--yellow"
                              : "admin-badge--red"
                          }`}
                        >
                          {user.status || "active"}
                        </span>
                      </td>
                      <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                      No recent user registrations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
