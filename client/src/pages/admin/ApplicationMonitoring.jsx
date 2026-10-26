import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "../../services/adminApi";
import { useAdminUI } from "../../context/AdminUIContext";

export default function ApplicationMonitoring() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Details Modal
  const [selectedApp, setSelectedApp] = useState(null);

  // Administrative Override Modal
  const [overrideModal, setOverrideModal] = useState(null); // { app, targetStatus }
  const [overrideReason, setOverrideReason] = useState("");
  const [submittingOverride, setSubmittingOverride] = useState(false);

  const { showToast } = useAdminUI();

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
        search,
      });

      const res = await adminFetch(`/applications?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load admission applications");
      }
      setApplications(data.applications || []);
      setPagination({
        total: data.total ?? data.pagination?.total ?? (data.applications ? data.applications.length : 0),
        pages: data.totalPages ?? data.pagination?.pages ?? 1,
      });
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, showToast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleOpenOverride = (app, targetStatus) => {
    setOverrideModal({ app, targetStatus });
    setOverrideReason("");
  };

  const handleConfirmOverride = async () => {
    if (!overrideModal) return;
    const { app, targetStatus } = overrideModal;

    if (!overrideReason.trim()) {
      showToast("error", "An audited administrative reason is required for status overrides.");
      return;
    }

    setSubmittingOverride(true);
    try {
      const res = await adminFetch(`/applications/${app._id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: targetStatus,
          reason: overrideReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to override application status");
      }

      showToast("success", `Application status administratively set to ${targetStatus.toUpperCase()}`);
      setOverrideModal(null);
      fetchApplications();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSubmittingOverride(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "accepted":
        return <span className="admin-badge admin-badge--green">Accepted</span>;
      case "rejected":
        return <span className="admin-badge admin-badge--red">Rejected</span>;
      case "pending":
      default:
        return <span className="admin-badge admin-badge--yellow">Pending</span>;
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Admission Applications Oversight</h1>
          <p className="admin-page-sub">
            Monitor real-time admission requests across all partner institutes, inspect candidate data, and track status changes.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search student, institute, or course..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Application Statuses</option>
            <option value="pending">Pending Institute Decision</option>
            <option value="accepted">Accepted / Admitted</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <div>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
            Total Applications: {pagination.total}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Student Applicant</th>
                <th>Target Institute</th>
                <th>Applied Course</th>
                <th>Decision Status</th>
                <th>Submission Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    Loading application records...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="admin-empty-state">
                      <svg className="admin-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h4 style={{ margin: "0 0 0.5rem", color: "#0f172a" }}>No Applications Found</h4>
                      <p style={{ margin: 0, fontSize: "0.875rem" }}>
                        No student admission applications match the current filter parameters.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{app.student?.name || "Applicant"}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{app.student?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{app.institute?.name || "Institute"}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{app.institute?.city || ""}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>
                        {app.courseName || "General Admission"}
                      </span>
                    </td>
                    <td>
                      {getStatusBadge(app.status)}
                      {app.overrideReason && (
                        <div style={{ fontSize: "0.7rem", color: "#086d7d", marginTop: "0.2rem" }}>
                          Overridden: {app.overrideReason}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {new Date(app.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => setSelectedApp(app)}
                        >
                          View Details
                        </button>

                        {/* Audited administrative status override */}
                        {app.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              className="admin-btn admin-btn-success admin-btn-sm"
                              onClick={() => handleOpenOverride(app, "accepted")}
                              title="Administrative Override to Accepted"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              onClick={() => handleOpenOverride(app, "rejected")}
                              title="Administrative Override to Rejected"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => handleOpenOverride(app, "pending")}
                            title="Reset to Pending"
                          >
                            Reset
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="admin-pagination">
            <span className="admin-page-indicator">
              Page {page} of {pagination.pages} ({pagination.total} records)
            </span>
            <div className="admin-page-buttons">
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-secondary admin-btn-sm"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedApp && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedApp(null)}>
          <div className="admin-modal" style={{ maxWidth: "38rem" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Application Record</h3>
                <div style={{ marginTop: "0.25rem" }}>{getStatusBadge(selectedApp.status)}</div>
              </div>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: "none", cursor: "pointer", padding: "0.25rem 0.5rem" }}
                onClick={() => setSelectedApp(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Student Name</strong>
                  <div>{selectedApp.student?.name || "Student"}</div>
                </div>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Student Email</strong>
                  <div>{selectedApp.student?.email}</div>
                </div>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Target Institute</strong>
                  <div>{selectedApp.institute?.name || "Institute"}</div>
                </div>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Course</strong>
                  <div>{selectedApp.courseName || "General Admission"}</div>
                </div>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Submitted Date</strong>
                  <div>{new Date(selectedApp.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Last Updated</strong>
                  <div>{new Date(selectedApp.updatedAt || selectedApp.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {selectedApp.remarks && (
                <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", backgroundColor: "#f8fafc", borderRadius: "0.5rem" }}>
                  <strong style={{ color: "#475569", fontSize: "0.8rem" }}>Student Remarks:</strong>
                  <p style={{ margin: "0.25rem 0 0", color: "#334155", fontSize: "0.875rem" }}>
                    {selectedApp.remarks}
                  </p>
                </div>
              )}

              {selectedApp.overrideReason && (
                <div style={{ padding: "0.75rem 1rem", backgroundColor: "#e0f2fe", borderRadius: "0.5rem", color: "#0369a1", fontSize: "0.85rem" }}>
                  <strong>Administrative Override Logged:</strong> {selectedApp.overrideReason}
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedApp(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override Confirmation Modal */}
      {overrideModal && (
        <div className="admin-modal-backdrop" onClick={() => !submittingOverride && setOverrideModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Administrative Decision Override</h3>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: "none", cursor: "pointer", padding: "0.25rem 0.5rem" }}
                onClick={() => !submittingOverride && setOverrideModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: "0 0 1rem", color: "#334155", fontSize: "0.9rem" }}>
                You are performing an administrative status override on the application of{" "}
                <strong>{overrideModal.app.student?.name}</strong> to{" "}
                <span style={{ fontWeight: 700 }}>{overrideModal.targetStatus.toUpperCase()}</span>.
              </p>

              <div>
                <label
                  htmlFor="override-reason"
                  style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem" }}
                >
                  Justification / Audit Reason <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  id="override-reason"
                  rows={3}
                  required
                  className="admin-search-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  placeholder="Mandatory explanation for compliance audit (e.g., student quota error resolution, administrative correction)..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={submittingOverride}
                onClick={() => setOverrideModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={submittingOverride}
                onClick={handleConfirmOverride}
              >
                {submittingOverride ? "Recording..." : "Execute Override"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
