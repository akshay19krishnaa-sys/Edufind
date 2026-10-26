import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "../../services/adminApi";
import { useAdminUI } from "../../context/AdminUIContext";

export default function ReportsAnalytics() {
  const [range, setRange] = useState("30d"); // '7d' | '30d' | '90d' | '1y'
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const { showToast } = useAdminUI();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/analytics/summary?range=${range}`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load platform analytics");
      }
      setAnalytics(data.analytics || {
        totals: data.summary,
        registrationsOverTime: data.registrationsOverTime,
        applicationsByStatus: data.applicationsByStatus,
        institutesByStatus: data.institutesByStatus,
      });
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [range, showToast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportCSV = async (type = "applications") => {
    setExporting(true);
    try {
      const res = await adminFetch(`/analytics/export?type=${type}&range=${range}`);
      if (!res.ok) {
        throw new Error("Failed to export report CSV");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `edufind_${type}_report_${range}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast("success", `Downloaded ${type} report CSV`);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#64748b" }}>
        <div style={{ display: "inline-block", width: "2.5rem", height: "2.5rem", border: "3px solid #cbd5e1", borderTopColor: "#086d7d", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ marginTop: "1rem", fontWeight: 600 }}>Aggregating time-series data...</p>
      </div>
    );
  }

  const {
    totals = {},
    registrationsOverTime = [],
    applicationsByStatus = {},
    institutesByStatus = {},
  } = analytics || {};

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Executive Reports & Data Analytics</h1>
          <p className="admin-page-sub">
            Time-filtered platform trends, admission status breakdowns, and one-click regulatory CSV exports.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {/* Time range switcher */}
          <div style={{ display: "inline-flex", backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "0.5rem", padding: "0.2rem" }}>
            {[
              { id: "7d", label: "7 Days" },
              { id: "30d", label: "30 Days" },
              { id: "90d", label: "90 Days" },
              { id: "1y", label: "1 Year" },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setRange(btn.id)}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: "0.375rem",
                  border: "none",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: range === btn.id ? "#086d7d" : "transparent",
                  color: range === btn.id ? "#ffffff" : "#475569",
                  transition: "all 0.15s ease",
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Export Dropdown / Button */}
          <button
            type="button"
            className="admin-btn admin-btn-secondary"
            disabled={exporting}
            onClick={() => handleExportCSV("applications")}
            title="Download CSV export"
          >
            <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>{exporting ? "Exporting..." : "Export Applications CSV"}</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="admin-metrics-grid">
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-label">New Student Registrations</span>
            <div className="admin-card-icon" style={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}>
              <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="admin-card-value">{totals.newStudents || 0}</div>
          <div className="admin-card-footer">
            <span>In selected {range} window</span>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-label">New Institute Registrations</span>
            <div className="admin-card-icon" style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>
              <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="admin-card-value">{totals.newInstitutes || 0}</div>
          <div className="admin-card-footer">
            <span>In selected {range} window</span>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-label">Applications Submitted</span>
            <div className="admin-card-icon" style={{ backgroundColor: "#fef3c7", color: "#b45309" }}>
              <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="admin-card-value">{totals.newApplications || 0}</div>
          <div className="admin-card-footer">
            <span>In selected {range} window</span>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-label">Verified Period Revenue</span>
            <div className="admin-card-icon" style={{ backgroundColor: "#ecfdf5", color: "#059669" }}>
              <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="admin-card-value">₹{(totals.revenue || 0).toLocaleString()}</div>
          <div className="admin-card-footer">
            <span>{totals.transactions || 0} completed orders</span>
          </div>
        </div>
      </div>

      {/* Breakdowns Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(24rem, 1fr))", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Application Status Distribution */}
        <div className="admin-table-container" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
            Admission Applications by Status
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              {
                label: "Pending Review",
                count: applicationsByStatus.pending || 0,
                color: "#f59e0b",
                bg: "#fef3c7",
              },
              {
                label: "Accepted / Admitted",
                count: applicationsByStatus.accepted || 0,
                color: "#16a34a",
                bg: "#dcfce7",
              },
              {
                label: "Rejected",
                count: applicationsByStatus.rejected || 0,
                color: "#dc2626",
                bg: "#fee2e2",
              },
            ].map((item) => {
              const totalApps = (applicationsByStatus.pending || 0) + (applicationsByStatus.accepted || 0) + (applicationsByStatus.rejected || 0);
              const pct = totalApps > 0 ? Math.round((item.count / totalApps) * 100) : 0;
              return (
                <div key={item.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                    <span style={{ color: "#334155" }}>{item.label}</span>
                    <span style={{ color: item.color }}>{item.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: "0.6rem", backgroundColor: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, backgroundColor: item.color, transition: "width 0.3s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Institute Verification Status Distribution */}
        <div className="admin-table-container" style={{ padding: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
            Institutes by Verification Status
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              {
                label: "Verified & Active",
                count: institutesByStatus.verified || 0,
                color: "#16a34a",
              },
              {
                label: "Pending Verification",
                count: institutesByStatus.pending || 0,
                color: "#f59e0b",
              },
              {
                label: "Rejected",
                count: institutesByStatus.rejected || 0,
                color: "#dc2626",
              },
              {
                label: "Suspended",
                count: institutesByStatus.suspended || 0,
                color: "#7e22ce",
              },
            ].map((item) => {
              const totalInst =
                (institutesByStatus.verified || 0) +
                (institutesByStatus.pending || 0) +
                (institutesByStatus.rejected || 0) +
                (institutesByStatus.suspended || 0);
              const pct = totalInst > 0 ? Math.round((item.count / totalInst) * 100) : 0;
              return (
                <div key={item.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.35rem", fontWeight: 600 }}>
                    <span style={{ color: "#334155" }}>{item.label}</span>
                    <span style={{ color: item.color }}>{item.count} ({pct}%)</span>
                  </div>
                  <div style={{ height: "0.6rem", backgroundColor: "#f1f5f9", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, backgroundColor: item.color, transition: "width 0.3s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Time Series Activity Bar Visualizer */}
      <div className="admin-table-container" style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
            Recent Activity Velocity
          </h3>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Daily Registration & Application Events</span>
        </div>

        {registrationsOverTime.length === 0 ? (
          <div className="admin-empty-state" style={{ padding: "2.5rem" }}>
            <p style={{ margin: 0 }}>No velocity data recorded in the selected {range} window.</p>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", height: "10rem", paddingTop: "1rem" }}>
            {registrationsOverTime.map((pt, i) => {
              const maxVal = Math.max(...registrationsOverTime.map((d) => d.count || 1), 5);
              const heightPct = Math.max(10, Math.round(((pt.count || 0) / maxVal) * 100));
              return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.35rem",
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#086d7d" }}>
                    {pt.count || 0}
                  </span>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: "2rem",
                      height: `${heightPct}%`,
                      backgroundColor: "#086d7d",
                      borderRadius: "0.25rem 0.25rem 0 0",
                      transition: "height 0.3s ease",
                    }}
                    title={`${pt.date}: ${pt.count} events`}
                  />
                  <span style={{ fontSize: "0.65rem", color: "#94a3b8", whiteSpace: "nowrap" }}>
                    {pt.date ? pt.date.slice(5) : `D${i + 1}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
