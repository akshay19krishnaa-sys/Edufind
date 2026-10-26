import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "../../services/adminApi";
import { useAdminUI } from "../../context/AdminUIContext";

export default function CourseModeration() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Action Modal
  const [actionModal, setActionModal] = useState(null); // { course, action }
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useAdminUI();

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
        search,
      });

      const res = await adminFetch(`/courses?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load courses");
      }
      setCourses(data.courses || []);
      setPagination({
        total: data.total ?? data.pagination?.total ?? (data.courses ? data.courses.length : 0),
        pages: data.totalPages ?? data.pagination?.pages ?? 1,
      });
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, showToast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleOpenAction = (course, action) => {
    setActionModal({ course, action });
    setRejectionReason(course.rejectionReason || "");
  };

  const handleUpdateStatus = async () => {
    if (!actionModal) return;
    const { course, action } = actionModal;

    setSubmitting(true);
    try {
      const res = await adminFetch(`/courses/${course._id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: action,
          rejectionReason: rejectionReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to update course status");
      }

      showToast("success", `Course status updated to ${action.toUpperCase()}`);
      setActionModal(null);
      fetchCourses();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "published":
        return <span className="admin-badge admin-badge--green">Published</span>;
      case "pending":
        return <span className="admin-badge admin-badge--yellow">Pending Approval</span>;
      case "rejected":
        return <span className="admin-badge admin-badge--red">Rejected</span>;
      case "hidden":
        return <span className="admin-badge admin-badge--gray">Hidden</span>;
      default:
        return <span className="admin-badge admin-badge--gray">{status}</span>;
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Course Catalog & Moderation</h1>
          <p className="admin-page-sub">
            Review submitted course listings, approve curriculum details, hide unverified programs, or reject low-quality entries.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by course title or description..."
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
            <option value="all">All Moderation Statuses</option>
            <option value="published">Published & Active</option>
            <option value="pending">Pending Approval</option>
            <option value="rejected">Rejected</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        <div>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
            Total Courses: {pagination.total}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Institute</th>
                <th>Status</th>
                <th>Fee & Duration</th>
                <th>Listed Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    Loading catalog courses...
                  </td>
                </tr>
              ) : courses.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="admin-empty-state">
                      <svg className="admin-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <h4 style={{ margin: "0 0 0.5rem", color: "#0f172a" }}>No Courses Found</h4>
                      <p style={{ margin: 0, fontSize: "0.875rem" }}>
                        Try adjusting your search criteria or filter status.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                courses.map((course) => (
                  <tr key={course._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{course.title || course.name}</div>
                      {course.description && (
                        <div style={{ fontSize: "0.78rem", color: "#64748b", maxWidth: "24rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {course.description}
                        </div>
                      )}
                      {course.rejectionReason && (
                        <div style={{ fontSize: "0.72rem", color: "#be123c", marginTop: "0.2rem" }}>
                          Rejection: {course.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{course.institute?.name || "Institute"}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{course.institute?.city || ""}</div>
                    </td>
                    <td>{getStatusBadge(course.status)}</td>
                    <td style={{ fontSize: "0.85rem", color: "#475569" }}>
                      <div>{course.fee ? `₹${Number(course.fee).toLocaleString()}` : "Free / N/A"}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{course.duration || "—"}</div>
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {new Date(course.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                        {course.status !== "published" && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-success admin-btn-sm"
                            onClick={() => handleOpenAction(course, "published")}
                          >
                            Approve
                          </button>
                        )}

                        {course.status !== "hidden" && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => handleOpenAction(course, "hidden")}
                          >
                            Hide
                          </button>
                        )}

                        {course.status !== "rejected" && (
                          <button
                            type="button"
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            onClick={() => handleOpenAction(course, "rejected")}
                          >
                            Reject
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
              Page {page} of {pagination.pages} ({pagination.total} courses)
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

      {/* Action Confirmation Modal */}
      {actionModal && (
        <div className="admin-modal-backdrop" onClick={() => !submitting && setActionModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {actionModal.action === "published"
                  ? "Publish Course"
                  : actionModal.action === "rejected"
                  ? "Reject Course"
                  : "Hide Course"}
              </h3>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: "none", cursor: "pointer", padding: "0.25rem 0.5rem" }}
                onClick={() => !submitting && setActionModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: "0 0 1rem", color: "#334155", fontSize: "0.9rem" }}>
                Confirm setting the status of <strong>{actionModal.course.title || actionModal.course.name}</strong> to{" "}
                <span style={{ fontWeight: 700 }}>{actionModal.action.toUpperCase()}</span>.
              </p>

              {actionModal.action === "rejected" && (
                <div>
                  <label
                    htmlFor="rejection-reason"
                    style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem" }}
                  >
                    Rejection Feedback (sent to institute)
                  </label>
                  <textarea
                    id="rejection-reason"
                    rows={3}
                    className="admin-search-input"
                    style={{ width: "100%", boxSizing: "border-box" }}
                    placeholder="Specify what needs to be corrected (e.g., incomplete syllabus, invalid fee disclosure)..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={submitting}
                onClick={() => setActionModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`admin-btn ${
                  actionModal.action === "published"
                    ? "admin-btn-success"
                    : actionModal.action === "rejected"
                    ? "admin-btn-danger"
                    : "admin-btn-secondary"
                }`}
                disabled={submitting}
                onClick={handleUpdateStatus}
              >
                {submitting ? "Processing..." : `Confirm ${actionModal.action.toUpperCase()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
