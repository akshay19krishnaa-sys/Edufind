import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "../../services/adminApi";
import { useAdminUI } from "../../context/AdminUIContext";

export default function FeaturedInstitutes() {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(false);

  // Edit Featured Modal
  const [editModal, setEditModal] = useState(null); // { institute, isFeatured, featuredPriority, featuredUntil }
  const [priority, setPriority] = useState(1);
  const [untilDate, setUntilDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { showToast } = useAdminUI();

  const fetchInstitutes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "50",
        status: "verified", // only verified institutes are eligible to be featured
        search,
      });

      const res = await adminFetch(`/institutes?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load verified institutes");
      }
      setInstitutes(data.institutes || []);
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    fetchInstitutes();
  }, [fetchInstitutes]);

  const handleOpenEdit = (inst) => {
    setEditModal(inst);
    setPriority(inst.featuredPriority || 1);
    setUntilDate(inst.featuredUntil ? inst.featuredUntil.split("T")[0] : "");
  };

  const handleToggleFeatured = async (inst, targetFeaturedState) => {
    try {
      const res = await adminFetch(`/institutes/${inst._id}/featured`, {
        method: "PUT",
        body: JSON.stringify({
          isFeatured: targetFeaturedState,
          featuredPriority: inst.featuredPriority || 1,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to update featured status");
      }

      showToast(
        "success",
        `${inst.name} is now ${targetFeaturedState ? "Featured on public discovery" : "Unfeatured"}`
      );
      fetchInstitutes();
    } catch (err) {
      showToast("error", err.message);
    }
  };

  const handleSaveModal = async () => {
    if (!editModal) return;

    setSubmitting(true);
    try {
      const res = await adminFetch(`/institutes/${editModal._id}/featured`, {
        method: "PUT",
        body: JSON.stringify({
          isFeatured: true,
          featuredPriority: Number(priority) || 1,
          featuredUntil: untilDate ? new Date(untilDate).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to update priority");
      }

      showToast("success", `Updated featured settings for ${editModal.name}`);
      setEditModal(null);
      fetchInstitutes();
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const displayedList = institutes.filter((inst) => {
    if (featuredOnly && !inst.isFeatured) return false;
    return true;
  });

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Featured Institute Showcases</h1>
          <p className="admin-page-sub">
            Prioritize verified educational institutes for premier placement on the public homepage and search directories.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar">
        <div className="admin-toolbar-left">
          <input
            type="text"
            className="admin-search-input"
            placeholder="Search verified institutes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.875rem", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
              style={{ width: "1rem", height: "1rem" }}
            />
            Show Featured Only
          </label>
        </div>

        <div>
          <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 600 }}>
            Featured Active: {institutes.filter((i) => i.isFeatured).length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-container">
        <div className="admin-table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Institute Name</th>
                <th>Location</th>
                <th>Featured Status</th>
                <th>Display Priority</th>
                <th>Featured Until</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                    Loading verified institutions...
                  </td>
                </tr>
              ) : displayedList.length === 0 ? (
                <tr>
                  <td colSpan="6">
                    <div className="admin-empty-state">
                      <svg className="admin-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <h4 style={{ margin: "0 0 0.5rem", color: "#0f172a" }}>No Verified Institutes Match</h4>
                      <p style={{ margin: 0, fontSize: "0.875rem" }}>
                        Only verified institutes can be promoted to featured listings.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayedList.map((inst) => (
                  <tr key={inst._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{inst.name}</div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{inst.email}</div>
                    </td>
                    <td style={{ fontSize: "0.825rem", color: "#475569" }}>
                      {[inst.city, inst.state].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td>
                      {inst.isFeatured ? (
                        <span className="admin-badge admin-badge--purple">★ Featured</span>
                      ) : (
                        <span className="admin-badge admin-badge--gray">Standard</span>
                      )}
                    </td>
                    <td>
                      {inst.isFeatured ? (
                        <span style={{ fontWeight: 700, color: "#086d7d", fontSize: "0.9rem" }}>
                          Rank #{inst.featuredPriority || 1}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td style={{ fontSize: "0.825rem", color: "#64748b" }}>
                      {inst.featuredUntil ? new Date(inst.featuredUntil).toLocaleDateString() : "Indefinite"}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "0.4rem" }}>
                        {inst.isFeatured ? (
                          <>
                            <button
                              type="button"
                              className="admin-btn admin-btn-secondary admin-btn-sm"
                              onClick={() => handleOpenEdit(inst)}
                            >
                              Edit Priority
                            </button>
                            <button
                              type="button"
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              onClick={() => handleToggleFeatured(inst, false)}
                            >
                              Unfeature
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="admin-btn admin-btn-success admin-btn-sm"
                            onClick={() => handleOpenEdit(inst)}
                          >
                            Feature Institute
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
      </div>

      {/* Featured Configuration Modal */}
      {editModal && (
        <div className="admin-modal-backdrop" onClick={() => !submitting && setEditModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Featured Promotion: {editModal.name}</h3>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ border: "none", cursor: "pointer", padding: "0.25rem 0.5rem" }}
                onClick={() => !submitting && setEditModal(null)}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div>
                  <label
                    htmlFor="featured-priority"
                    style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem" }}
                  >
                    Display Priority / Rank (Higher ranks display first)
                  </label>
                  <input
                    id="featured-priority"
                    type="number"
                    min="1"
                    max="1000"
                    className="admin-search-input"
                    style={{ width: "100%", boxSizing: "border-box" }}
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  />
                  <span style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem", display: "block" }}>
                    e.g. 10 will appear ahead of rank 1.
                  </span>
                </div>

                <div>
                  <label
                    htmlFor="featured-until"
                    style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#475569", marginBottom: "0.4rem" }}
                  >
                    Featured Until Date (Leave empty for indefinite duration)
                  </label>
                  <input
                    id="featured-until"
                    type="date"
                    className="admin-search-input"
                    style={{ width: "100%", boxSizing: "border-box" }}
                    value={untilDate}
                    onChange={(e) => setUntilDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                disabled={submitting}
                onClick={() => setEditModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn admin-btn-primary"
                disabled={submitting}
                onClick={handleSaveModal}
              >
                {submitting ? "Saving..." : "Save Promotion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
