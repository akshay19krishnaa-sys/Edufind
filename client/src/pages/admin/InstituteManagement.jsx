import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { adminFetch } from "../../services/adminApi";
import { useAdminUI } from "../../context/AdminUIContext";

export default function InstituteManagement() {
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Modals
  const [selectedInst, setSelectedInst] = useState(null);
  const [verificationModal, setVerificationModal] = useState(null); // { institute, action: 'verified' | 'rejected' | 'suspended' | 'pending' }
  const [reviewNotes, setReviewNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useAdminUI();

  const fetchInstitutes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
        search,
      });

      const res = await adminFetch(`/institutes?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to fetch institutes");
      }
      setInstitutes(data.institutes || []);
      setPagination({
        total: data.total ?? data.pagination?.total ?? (data.institutes ? data.institutes.length : 0),
        pages: data.totalPages ?? data.pagination?.pages ?? 1,
      });
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, showToast]);

  useEffect(() => {
    fetchInstitutes();
  }, [fetchInstitutes]);

  const handleOpenVerification = (inst, action) => {
    setVerificationModal({ institute: inst, action });
    setReviewNotes(inst.reviewNotes || inst.rejectionReason || "");
  };

  const handleUpdateVerification = async () => {
    if (!verificationModal) return;
    const { institute, action } = verificationModal;

    setSubmitting(true);
    try {
      const res = await adminFetch(`/institutes/${institute._id}/verification`, {
        method: "PUT",
        body: JSON.stringify({
          status: action,
          reviewNotes: reviewNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to update institute verification");
      }

      showToast("success", `Institute marked as ${action.toUpperCase()}`);
      setVerificationModal(null);
      fetchInstitutes();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "verified":
        return <span className="admin-badge admin-badge--green">Verified</span>;
      case "pending":
        return <span className="admin-badge admin-badge--yellow">Pending Verification</span>;
      case "rejected":
        return <span className="admin-badge admin-badge--red">Rejected</span>;
      case "suspended":
        return <span className="admin-badge admin-badge--red">Suspended</span>;
      default:
        return <span className="admin-badge admin-badge--gray">{status || "Unknown"}</span>;
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Institutes & Verification Pipeline</h1>
          <p className="admin-page-sub">
            Review submitted credentials, manage institutional verification, approve programs, and handle suspensions.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by institute name, email, or city..."
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
            <option value="all">All Verification Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="verified">Verified & Live</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
            Total Institutes: {pagination.total}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Institute</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Location</th>
                <th>Courses</th>
                <th>Registered</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    Loading institute records...
                  </td>
                </tr>
              ) : institutes.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="admin-empty-state">
                      <svg className="admin-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <h4 style={{ margin: "0 0 0.5rem", color: "#0f172a" }}>No Institutes Found</h4>
                      <p style={{ margin: 0, fontSize: "0.875rem" }}>
                        No institutes match your current filter settings.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                institutes.map((inst) => (
                  <tr key={inst._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{inst.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{inst.email}</div>
                    </td>
                    <td>{getStatusBadge(inst.status)}</td>
                    <td>
                      {inst.isFeatured ? (
                        <span className="admin-badge admin-badge--purple">★ Priority {inst.featuredPriority || 0}</span>
                      ) : (
                        <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>Standard</span>
                      )}
                    </td>
                    <td style={{ fontSize: "0.825rem", color: "#475569" }}>
                      {[inst.city, inst.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td style={{ fontSize: "0.825rem", fontWeight: 600 }}>
                      {inst.courses?.length || 0}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {new Date(inst.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                        <button
                          type="button"
                          className="admin-btn admin-btn-secondary admin-btn-sm"
                          onClick={() => setSelectedInst(inst)}
                        >
                          Profile
                        </button>

                        {inst.status === "pending" && (
                          <>
                            <button
                              type="button"
                              className="admin-btn admin-btn-success admin-btn-sm"
                              onClick={() => handleOpenVerification(inst, "verified")}
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              onClick={() => handleOpenVerification(inst, "rejected")}
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {inst.status === "verified" && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => handleOpenVerification(inst, "suspended")}
                          >
                            Suspend
                          </button>
                        )}

                        {(inst.status === "suspended" || inst.status === "rejected") && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-success admin-btn-sm"
                            onClick={() => handleOpenVerification(inst, "verified")}
                          >
                            Reinstate
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
              Page {page} of {pagination.pages} ({pagination.total} institutes)
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

      {/* Institute Detail Modal */}
      {selectedInst && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedInst(null)}>
          <div className="admin-modal" style={{ maxWidth: "40rem" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">{selectedInst.name}</h3>
                <div style={{ marginTop: "0.25rem" }}>{getStatusBadge(selectedInst.status)}</div>
              </div>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: "none", cursor: "pointer", padding: "0.25rem 0.5rem" }}
                onClick={() => setSelectedInst(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Official Email</strong>
                  <div>{selectedInst.email}</div>
                </div>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Phone</strong>
                  <div>{selectedInst.phone || "—"}</div>
                </div>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Location</strong>
                  <div>{[selectedInst.city, selectedInst.state].filter(Boolean).join(", ") || "—"}</div>
                </div>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Website</strong>
                  <div>
                    {selectedInst.website ? (
                      <a href={selectedInst.website} target="_blank" rel="noopener noreferrer" style={{ color: "#086d7d" }}>
                        {selectedInst.website}
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              </div>

              {selectedInst.about && (
                <div style={{ marginBottom: "1.25rem" }}>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Overview</strong>
                  <p style={{ margin: "0.25rem 0 0", color: "#334155", lineHeight: 1.5, fontSize: "0.875rem" }}>
                    {selectedInst.about}
                  </p>
                </div>
              )}

              {/* Review Notes or Rejection Reason if any */}
              {selectedInst.reviewNotes && (
                <div style={{ padding: "0.75rem 1rem", backgroundColor: "#f1f5f9", borderRadius: "0.5rem", marginBottom: "1.25rem", fontSize: "0.85rem" }}>
                  <strong style={{ color: "#475569" }}>Admin Review Notes:</strong> {selectedInst.reviewNotes}
                </div>
              )}

              {/* Courses listed */}
              <div>
                <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                  Registered Courses ({selectedInst.courses?.length || 0})
                </strong>
                {selectedInst.courses && selectedInst.courses.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {selectedInst.courses.map((c, i) => (
                      <span
                        key={i}
                        style={{
                          padding: "0.25rem 0.65rem",
                          borderRadius: "0.375rem",
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          fontSize: "0.8rem",
                          color: "#334155",
                        }}
                      >
                        {typeof c === "string" ? c : c.name || "Course"}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: "0.85rem", color: "#94a3b8" }}>No courses currently listed</span>
                )}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedInst(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification Action Modal */}
      {verificationModal && (
        <div className="admin-modal-backdrop" onClick={() => !submitting && setVerificationModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {verificationModal.action === "verified"
                  ? "Approve Institute"
                  : verificationModal.action === "rejected"
                  ? "Reject Institute Registration"
                  : "Suspend Institute"}
              </h3>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: "none", cursor: "pointer", padding: "0.25rem 0.5rem" }}
                onClick={() => !submitting && setVerificationModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: "0 0 1rem", color: "#334155", fontSize: "0.9rem" }}>
                Confirm setting the status of <strong>{verificationModal.institute.name}</strong> to{" "}
                <span style={{ fontWeight: 700 }}>{verificationModal.action.toUpperCase()}</span>.
              </p>

              <div>
                <label
                  htmlFor="review-notes"
                  style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem" }}
                >
                  Administrative Notes / Feedback for Institute
                </label>
                <textarea
                  id="review-notes"
                  rows={3}
                  className="admin-search-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  placeholder="Optional review notes explaining decision or documentation status..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={submitting}
                onClick={() => setVerificationModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`admin-btn ${
                  verificationModal.action === "verified"
                    ? "admin-btn-success"
                    : "admin-btn-danger"
                }`}
                disabled={submitting}
                onClick={handleUpdateVerification}
              >
                {submitting ? "Processing..." : `Confirm ${verificationModal.action.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
