import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "../../services/adminApi";
import { useAdminUI } from "../../context/AdminUIContext";

export default function ContentModeration() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Resolution Modal
  const [activeReport, setActiveReport] = useState(null); // report object
  const [resolutionStatus, setResolutionStatus] = useState("resolved"); // 'resolved' | 'dismissed' | 'under_review'
  const [actionNotes, setActionNotes] = useState("");
  const [hideTargetContent, setHideTargetContent] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useAdminUI();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
        contentType: typeFilter,
      });

      const res = await adminFetch(`/moderation/reports?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load moderation reports");
      }
      setReports(data.reports || []);
      setPagination({
        total: data.total ?? data.pagination?.total ?? (data.reports ? data.reports.length : 0),
        pages: data.totalPages ?? data.pagination?.pages ?? 1,
      });
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleOpenResolution = (report, targetStatus = "resolved") => {
    setActiveReport(report);
    setResolutionStatus(targetStatus);
    setActionNotes("");
    setHideTargetContent(targetStatus === "resolved");
  };

  const handleConfirmResolution = async () => {
    if (!activeReport) return;

    setSubmitting(true);
    try {
      const res = await adminFetch(`/moderation/reports/${activeReport._id}/resolve`, {
        method: "PUT",
        body: JSON.stringify({
          status: resolutionStatus,
          actionNotes: actionNotes.trim() || undefined,
          hideContent: hideTargetContent && resolutionStatus === "resolved",
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to update moderation report");
      }

      showToast("success", `Moderation report marked as ${resolutionStatus.toUpperCase()}`);
      setActiveReport(null);
      fetchReports();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "resolved":
        return <span className="admin-badge admin-badge--green">Resolved</span>;
      case "dismissed":
        return <span className="admin-badge admin-badge--gray">Dismissed</span>;
      case "under_review":
        return <span className="admin-badge admin-badge--blue">Under Review</span>;
      case "pending":
      default:
        return <span className="admin-badge admin-badge--red">Pending Action</span>;
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Content Moderation Queue</h1>
          <p className="admin-page-sub">
            Investigate flagged institute profiles, misleading course descriptions, or abusive community content.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Moderation Statuses</option>
            <option value="pending">Pending Reports</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed (No Action)</option>
          </select>

          <select
            className="admin-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Content Types</option>
            <option value="review">Reviews</option>
            <option value="course">Course Listings</option>
            <option value="institute">Institute Profiles</option>
            <option value="other">Other Reports</option>
          </select>
        </div>

        <div>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
            Total Reports: {pagination.total}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Flagged Item</th>
                <th>Type</th>
                <th>Status</th>
                <th>Reported Reason & Details</th>
                <th>Reported On</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    Loading moderation queue...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="admin-empty-state">
                      <svg className="admin-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 style={{ margin: "0 0 0.5rem", color: "#0f172a" }}>Queue Is Clear</h4>
                      <p style={{ margin: 0, fontSize: "0.875rem" }}>
                        There are no reported content items requiring administrative moderation at this time.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>
                        {report.targetName || report.targetType || "Reported Entity"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                        ID: {report.targetId ? String(report.targetId).slice(-8) : "—"}
                      </div>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge--purple">
                        {report.targetType || report.contentType || "General"}
                      </span>
                    </td>
                    <td>{getStatusBadge(report.status)}</td>
                    <td style={{ maxWidth: "22rem" }}>
                      <div style={{ fontWeight: 600, color: "#be123c", fontSize: "0.825rem" }}>
                        {report.reason}
                      </div>
                      {report.details && (
                        <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: "0.2rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {report.details}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                        {report.status !== "resolved" && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => handleOpenResolution(report, "resolved")}
                          >
                            Take Action
                          </button>
                        )}

                        {report.status !== "dismissed" && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => handleOpenResolution(report, "dismissed")}
                          >
                            Dismiss
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
              Page {page} of {pagination.pages} ({pagination.total} reports)
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

      {/* Resolution Modal */}
      {activeReport && (
        <div className="admin-modal-backdrop" onClick={() => !submitting && setActiveReport(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {resolutionStatus === "resolved" ? "Resolve Report & Enforce Policy" : "Dismiss Report"}
              </h3>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: "none", cursor: "pointer", padding: "0.25rem 0.5rem" }}
                onClick={() => !submitting && setActiveReport(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ padding: "0.75rem 1rem", backgroundColor: "#f8fafc", borderRadius: "0.5rem", marginBottom: "1rem" }}>
                <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                  Reported Issue
                </div>
                <div style={{ fontWeight: 600, color: "#be123c", marginTop: "0.2rem" }}>
                  {activeReport.reason}
                </div>
                {activeReport.details && (
                  <div style={{ fontSize: "0.85rem", color: "#334155", marginTop: "0.4rem" }}>
                    {activeReport.details}
                  </div>
                )}
              </div>

              {resolutionStatus === "resolved" && (
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>
                    <input
                      type="checkbox"
                      checked={hideTargetContent}
                      onChange={(e) => setHideTargetContent(e.target.checked)}
                      style={{ width: "1rem", height: "1rem" }}
                    />
                    Hide or unpublish reported content from public listings
                  </label>
                </div>
              )}

              <div>
                <label
                  htmlFor="moderation-notes"
                  style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem" }}
                >
                  Administrative Notes / Audit Justification
                </label>
                <textarea
                  id="moderation-notes"
                  rows={3}
                  className="admin-search-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  placeholder="Explain reason for action taken or dismissal..."
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={submitting}
                onClick={() => setActiveReport(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`admin-btn ${resolutionStatus === "resolved" ? "admin-btn-danger" : "admin-btn-secondary"}`}
                disabled={submitting}
                onClick={handleConfirmResolution}
              >
                {submitting ? "Processing..." : `Confirm ${resolutionStatus.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
