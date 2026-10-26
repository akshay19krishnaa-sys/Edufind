import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "../../services/adminApi";
import { useAdminUI } from "../../context/AdminUIContext";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  const { showToast } = useAdminUI();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        action: actionFilter,
        targetType: targetFilter,
        search,
      });

      const res = await adminFetch(`/audit-logs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load audit logs");
      }
      setLogs(data.logs || []);
      setPagination({
        total: data.total ?? data.pagination?.total ?? (data.logs ? data.logs.length : 0),
        pages: data.totalPages ?? data.pagination?.pages ?? 1,
      });
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, targetFilter, search, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionBadge = (action) => {
    if (action.includes("SUSPEND") || action.includes("REJECT") || action.includes("DELETE")) {
      return <span className="admin-badge admin-badge--red">{action}</span>;
    }
    if (action.includes("VERIF") || action.includes("PUBLISH") || action.includes("ACCEPT") || action.includes("ACTIVE")) {
      return <span className="admin-badge admin-badge--green">{action}</span>;
    }
    if (action.includes("FEATURE") || action.includes("OVERRIDE")) {
      return <span className="admin-badge admin-badge--purple">{action}</span>;
    }
    return <span className="admin-badge admin-badge--blue">{action}</span>;
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Administrative Audit Trail</h1>
          <p className="admin-page-sub">
            Immutable log of all administrative actions, verifications, account suspensions, content resolutions, and configuration updates.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by admin email, target ID, or notes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <select
            className="admin-select"
            value={targetFilter}
            onChange={(e) => {
              setTargetFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Modules</option>
            <option value="Student">Students</option>
            <option value="Institute">Institutes</option>
            <option value="Course">Courses</option>
            <option value="Application">Applications</option>
            <option value="Report">Moderation</option>
            <option value="Transaction">Transactions</option>
            <option value="PlatformSetting">Settings</option>
          </select>
        </div>

        <div>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
            Audit Entries: {pagination.total}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Administrator</th>
                <th>Action</th>
                <th>Target Entity</th>
                <th>Reason / Summary Notes</th>
                <th style={{ textAlign: "right" }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    Loading audit trail records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="admin-empty-state">
                      <svg className="admin-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h4 style={{ margin: "0 0 0.5rem", color: "#0f172a" }}>No Audit Records Found</h4>
                      <p style={{ margin: 0, fontSize: "0.875rem" }}>
                        All sensitive operations performed in the control panel will automatically register here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id}>
                    <td style={{ fontSize: "0.8rem", color: "#64748b", whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>
                        {log.adminEmail || "System Administrator"}
                      </div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                        IP: {log.ipAddress || "Internal"}
                      </div>
                    </td>
                    <td>{getActionBadge(log.action)}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{log.targetType}</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b", fontFamily: "monospace" }}>
                        {log.targetId ? String(log.targetId).slice(-8) : "—"}
                      </div>
                    </td>
                    <td style={{ maxWidth: "22rem" }}>
                      <div style={{ fontSize: "0.825rem", color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.reason || log.notes || "Standard administrative modification"}
                      </div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        Inspect
                      </button>
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
              Page {page} of {pagination.pages} ({pagination.total} audit entries)
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

      {/* Inspect Modal */}
      {selectedLog && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="admin-modal" style={{ maxWidth: "40rem" }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h3 className="admin-modal-title">Audit Log Entry</h3>
                <div style={{ marginTop: "0.25rem" }}>{getActionBadge(selectedLog.action)}</div>
              </div>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: "none", cursor: "pointer", padding: "0.25rem 0.5rem" }}
                onClick={() => setSelectedLog(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Administrator</strong>
                  <div>{selectedLog.adminEmail || "Admin"}</div>
                </div>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Logged Timestamp</strong>
                  <div>{new Date(selectedLog.createdAt).toLocaleString()}</div>
                </div>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Target Entity</strong>
                  <div>{selectedLog.targetType} (ID: {selectedLog.targetId})</div>
                </div>
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase" }}>Network IP</strong>
                  <div>{selectedLog.ipAddress || "127.0.0.1"}</div>
                </div>
              </div>

              {selectedLog.reason && (
                <div style={{ marginBottom: "1rem", padding: "0.75rem 1rem", backgroundColor: "#f8fafc", borderRadius: "0.5rem" }}>
                  <strong style={{ color: "#475569", fontSize: "0.8rem" }}>Recorded Justification / Notes:</strong>
                  <p style={{ margin: "0.25rem 0 0", color: "#334155", fontSize: "0.875rem" }}>
                    {selectedLog.reason}
                  </p>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <strong style={{ color: "#64748b", fontSize: "0.75rem", textTransform: "uppercase", display: "block", marginBottom: "0.5rem" }}>
                    Action Metadata
                  </strong>
                  <pre
                    style={{
                      backgroundColor: "#0f172a",
                      color: "#38bdf8",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      fontSize: "0.75rem",
                      overflowX: "auto",
                      margin: 0,
                    }}
                  >
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedLog(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
