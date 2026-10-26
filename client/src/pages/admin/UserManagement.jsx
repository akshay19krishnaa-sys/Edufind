import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "../../services/adminApi";
import { useAdminUI } from "../../context/AdminUIContext";

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Detail Modal State
  const [selectedUser, setSelectedUser] = useState(null);

  // Suspend/Activate Modal State
  const [actionModal, setActionModal] = useState(null); // { user, targetStatus, reason }
  const [actionReason, setActionReason] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  const { showToast } = useAdminUI();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        type: typeFilter,
        status: statusFilter,
        search,
      });

      const res = await adminFetch(`/users?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load platform users");
      }
      setUsers(data.users || []);
      setPagination({
        total: data.total ?? data.pagination?.total ?? (data.users ? data.users.length : 0),
        pages: data.totalPages ?? data.pagination?.pages ?? 1,
      });
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, statusFilter, search, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenAction = (user, targetStatus) => {
    setActionModal({ user, targetStatus });
    setActionReason("");
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    const { user, targetStatus } = actionModal;

    setSubmittingAction(true);
    try {
      const res = await adminFetch(`/users/${user.type}/${user._id}/status`, {
        method: "PUT",
        body: JSON.stringify({
          status: targetStatus,
          reason: actionReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to update account status");
      }

      showToast(
        "success",
        `Successfully ${targetStatus === "suspended" ? "suspended" : "activated"} ${user.name}`
      );
      setActionModal(null);
      fetchUsers();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users & Account Governance</h1>
          <p className="admin-page-sub">
            Search, inspect, activate, or suspend student and institute platform accounts.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by name, email, or city..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />

          <select
            className="admin-select"
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Account Types</option>
            <option value="student">Students Only</option>
            <option value="institute">Institutes Only</option>
          </select>

          <select
            className="admin-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>

        <div>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
            Total Found: {pagination.total}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Account Holder</th>
                <th>Type</th>
                <th>Status</th>
                <th>Contact</th>
                <th>Registration Date</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="admin-empty-state">
                      <svg className="admin-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <h4 style={{ margin: "0 0 0.5rem", color: "#0f172a" }}>No Accounts Found</h4>
                      <p style={{ margin: 0, fontSize: "0.875rem" }}>
                        Try adjusting your search criteria or filter options.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSuspended = u.status === "suspended";
                  return (
                    <tr key={`${u.type}-${u._id}`}>
                      <td>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{u.name}</div>
                        <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{u.email}</div>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            u.type === "institute" ? "admin-badge--blue" : "admin-badge--purple"
                          }`}
                        >
                          {u.type}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-badge ${
                            isSuspended ? "admin-badge--red" : "admin-badge--green"
                          }`}
                        >
                          {u.status || "active"}
                        </span>
                        {isSuspended && u.suspensionReason && (
                          <div style={{ fontSize: "0.72rem", color: "#be123c", marginTop: "0.2rem" }}>
                            Reason: {u.suspensionReason}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: "0.85rem", color: "#475569" }}>
                        <div>{u.phone || "—"}</div>
                        <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{u.city || ""}</div>
                      </td>
                      <td style={{ fontSize: "0.825rem", color: "#64748b" }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                          <button
                            type="button"
                            className="admin-btn admin-btn-secondary admin-btn-sm"
                            onClick={() => setSelectedUser(u)}
                            title="Inspect details"
                          >
                            Details
                          </button>

                          {isSuspended ? (
                            <button
                              type="button"
                              className="admin-btn admin-btn-success admin-btn-sm"
                              onClick={() => handleOpenAction(u, "active")}
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              onClick={() => handleOpenAction(u, "suspended")}
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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

      {/* Account Details Modal */}
      {selectedUser && (
        <div className="admin-modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Account Profile: {selectedUser.name}</h3>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: "none", cursor: "pointer", padding: "0.25rem 0.5rem" }}
                onClick={() => setSelectedUser(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", fontSize: "0.875rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Account Type
                  </label>
                  <p style={{ margin: "0.2rem 0", fontWeight: 600 }}>{selectedUser.type}</p>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Status
                  </label>
                  <p style={{ margin: "0.2rem 0", fontWeight: 600 }}>{selectedUser.status || "active"}</p>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Email
                  </label>
                  <p style={{ margin: "0.2rem 0" }}>{selectedUser.email}</p>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Phone
                  </label>
                  <p style={{ margin: "0.2rem 0" }}>{selectedUser.phone || "Not specified"}</p>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Location
                  </label>
                  <p style={{ margin: "0.2rem 0" }}>
                    {[selectedUser.city, selectedUser.state].filter(Boolean).join(", ") || "Not specified"}
                  </p>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                    Member Since
                  </label>
                  <p style={{ margin: "0.2rem 0" }}>
                    {new Date(selectedUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {selectedUser.suspensionReason && (
                <div style={{ marginTop: "1.25rem", padding: "0.75rem 1rem", backgroundColor: "#ffe4e6", borderRadius: "0.5rem", color: "#be123c" }}>
                  <strong>Suspension Reason:</strong> {selectedUser.suspensionReason}
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend / Reactivate Reason Modal */}
      {actionModal && (
        <div className="admin-modal-backdrop" onClick={() => !submittingAction && setActionModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">
                {actionModal.targetStatus === "suspended" ? "Suspend Account" : "Reactivate Account"}
              </h3>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: "none", cursor: "pointer", padding: "0.25rem 0.5rem" }}
                onClick={() => !submittingAction && setActionModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: "0 0 1rem", color: "#334155", fontSize: "0.9rem" }}>
                Are you sure you want to change the status of <strong>{actionModal.user.name}</strong> ({actionModal.user.email}) to{" "}
                <span style={{ fontWeight: 700, color: actionModal.targetStatus === "suspended" ? "#dc2626" : "#16a34a" }}>
                  {actionModal.targetStatus.toUpperCase()}
                </span>
                ?
              </p>

              {actionModal.targetStatus === "suspended" && (
                <div>
                  <label
                    htmlFor="suspension-reason"
                    style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem" }}
                  >
                    Reason for Suspension (recorded in audit log)
                  </label>
                  <textarea
                    id="suspension-reason"
                    rows={3}
                    className="admin-search-input"
                    style={{ width: "100%", boxSizing: "border-box" }}
                    placeholder="e.g. Terms of service violation, fraudulent documentation..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                  />
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={submittingAction}
                onClick={() => setActionModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`admin-btn ${
                  actionModal.targetStatus === "suspended" ? "admin-btn-danger" : "admin-btn-success"
                }`}
                disabled={submittingAction}
                onClick={handleConfirmAction}
              >
                {submittingAction
                  ? "Saving..."
                  : actionModal.targetStatus === "suspended"
                  ? "Confirm Suspension"
                  : "Confirm Activation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
