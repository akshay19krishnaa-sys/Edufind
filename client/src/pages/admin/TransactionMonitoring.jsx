import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "../../services/adminApi";
import { useAdminUI } from "../../context/AdminUIContext";

export default function TransactionMonitoring() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalCount: 0, successfulCount: 0, verifiedRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });

  // Refund Modal
  const [refundModal, setRefundModal] = useState(null); // { transaction }
  const [refundReason, setRefundReason] = useState("");
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const { showToast } = useAdminUI();

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "15",
        status: statusFilter,
        search,
      });

      const res = await adminFetch(`/transactions?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load transaction records");
      }
      setTransactions(data.transactions || []);
      setSummary(
        data.summary || {
          totalCount: data.total ?? (data.transactions ? data.transactions.length : 0),
          successfulCount: data.stats?.successful ?? 0,
          verifiedRevenue: data.stats?.verifiedRevenue ?? 0,
        }
      );
      setPagination({
        total: data.total ?? data.pagination?.total ?? (data.transactions ? data.transactions.length : 0),
        pages: data.totalPages ?? data.pagination?.pages ?? 1,
      });
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, showToast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleOpenRefund = (txn) => {
    setRefundModal(txn);
    setRefundReason("");
  };

  const handleConfirmRefund = async () => {
    if (!refundModal) return;

    if (!refundReason.trim()) {
      showToast("error", "An audited refund reason is required.");
      return;
    }

    setSubmittingRefund(true);
    try {
      const res = await adminFetch(`/transactions/${refundModal._id}/refund`, {
        method: "POST",
        body: JSON.stringify({
          reason: refundReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to process transaction refund");
      }

      showToast("success", `Transaction ${refundModal.transactionId} marked as refunded`);
      setRefundModal(null);
      fetchTransactions();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSubmittingRefund(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "successful":
        return <span className="admin-badge admin-badge--green">Successful</span>;
      case "refunded":
        return <span className="admin-badge admin-badge--purple">Refunded</span>;
      case "failed":
        return <span className="admin-badge admin-badge--red">Failed</span>;
      case "pending":
      default:
        return <span className="admin-badge admin-badge--yellow">Pending</span>;
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Financial & Transaction Monitoring</h1>
          <p className="admin-page-sub">
            Real-time ledger of verified admission fees, course purchases, transaction receipts, and refunds.
          </p>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="admin-metrics-grid">
        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-label">Verified Platform Revenue</span>
            <div className="admin-card-icon" style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>
              <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="admin-card-value">₹{(summary.verifiedRevenue || 0).toLocaleString()}</div>
          <div className="admin-card-footer">
            <span>Settled transactions only</span>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-label">Successful Payments</span>
            <div className="admin-card-icon" style={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}>
              <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="admin-card-value">{summary.successfulCount || 0}</div>
          <div className="admin-card-footer">
            <span>Total orders completed</span>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <span className="admin-card-label">Total Logged Transactions</span>
            <div className="admin-card-icon" style={{ backgroundColor: "#f1f5f9", color: "#475569" }}>
              <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="admin-card-value">{summary.totalCount || 0}</div>
          <div className="admin-card-footer">
            <span>All gateway intents</span>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search by transaction ID or user email..."
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
            <option value="all">All Payment Statuses</option>
            <option value="successful">Successful Only</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
            Transactions: {pagination.total}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>User / Student</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment Method</th>
                <th>Date & Time</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    Loading financial records...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="7">
                    <div className="admin-empty-state">
                      <svg className="admin-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <h4 style={{ margin: "0 0 0.5rem", color: "#0f172a" }}>No Transactions Recorded</h4>
                      <p style={{ margin: 0, fontSize: "0.875rem" }}>
                        Live transactions from students and institutes will appear here automatically when payments are processed.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr key={txn._id}>
                    <td>
                      <div style={{ fontWeight: 700, fontFamily: "monospace", color: "#0f172a" }}>
                        {txn.transactionId || String(txn._id).slice(-10)}
                      </div>
                      {txn.orderId && (
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Order: {txn.orderId}</div>
                      )}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{txn.user?.name || "Customer"}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{txn.user?.email || "—"}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: "#0f172a", fontSize: "0.95rem" }}>
                        ₹{Number(txn.amount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td>{getStatusBadge(txn.status)}</td>
                    <td style={{ fontSize: "0.825rem", color: "#475569" }}>
                      {txn.paymentMethod || "Razorpay / Gateway"}
                    </td>
                    <td style={{ fontSize: "0.8rem", color: "#64748b" }}>
                      {new Date(txn.createdAt).toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      {txn.status === "successful" && (
                        <button
                          type="button"
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => handleOpenRefund(txn)}
                        >
                          Record Refund
                        </button>
                      )}
                      {txn.status === "refunded" && (
                        <span style={{ fontSize: "0.75rem", color: "#7e22ce", fontWeight: 600 }}>
                          Refund Logged
                        </span>
                      )}
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

      {/* Record Refund Modal */}
      {refundModal && (
        <div className="admin-modal-backdrop" onClick={() => !submittingRefund && setRefundModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Record Transaction Refund</h3>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: "none", cursor: "pointer", padding: "0.25rem 0.5rem" }}
                onClick={() => !submittingRefund && setRefundModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: "0 0 1rem", color: "#334155", fontSize: "0.9rem" }}>
                Record a refund of <strong>₹{Number(refundModal.amount).toLocaleString()}</strong> for transaction{" "}
                <code style={{ backgroundColor: "#f1f5f9", padding: "0.15rem 0.4rem", borderRadius: "0.25rem" }}>
                  {refundModal.transactionId}
                </code>
                .
              </p>

              <div>
                <label
                  htmlFor="refund-reason"
                  style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem" }}
                >
                  Refund Justification / Provider Reference <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <textarea
                  id="refund-reason"
                  rows={3}
                  required
                  className="admin-search-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  placeholder="e.g. Gateway refund ID, customer requested cancellation within 24h..."
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={submittingRefund}
                onClick={() => setRefundModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-danger"
                disabled={submittingRefund}
                onClick={handleConfirmRefund}
              >
                {submittingRefund ? "Recording..." : "Confirm Refund"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
