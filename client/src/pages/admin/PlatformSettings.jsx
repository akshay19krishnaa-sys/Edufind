import { useState, useEffect } from "react";
import { adminFetch } from "../../services/adminApi";
import { useAdminUI } from "../../context/AdminUIContext";

export default function PlatformSettings() {
  const [settings, setSettings] = useState({
    platformName: "EduFind",
    supportEmail: "support@edufind.com",
    supportPhone: "+91 98765 43210",
    admissionsOpen: true,
    admissionDeadlineNotice: "Admissions for the current academic session are actively open.",
    autoVerifyInstitutes: false,
    allowPublicInstituteSignup: true,
    requireReviewApproval: true,
    requireCourseApproval: true,
    maxFeaturedInstitutes: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { showToast, confirmAction } = useAdminUI();

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await adminFetch("/settings");
      const data = await res.json();
      if (!res.ok || data.success === false) {
        throw new Error(data.message || "Failed to load platform settings");
      }
      if (data.settingsMap) {
        setSettings((prev) => ({ ...prev, ...data.settingsMap }));
      } else if (data.settings) {
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch (err) {
      showToast("error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();

    confirmAction({
      title: "Update Platform Configuration",
      message:
        "Applying these configuration changes will immediately update platform rules across registration, admissions, and content moderation.",
      confirmText: "Save Configuration",
      isDanger: false,
      onConfirm: async () => {
        setSaving(true);
        try {
          const res = await adminFetch("/settings", {
            method: "PUT",
            body: JSON.stringify(settings),
          });

          const data = await res.json();
          if (!res.ok || data.success === false) {
            throw new Error(data.message || "Failed to update platform settings");
          }

          showToast("success", "Platform settings updated and persisted successfully");
        } catch (err) {
          showToast("error", err.message);
        } finally {
          setSaving(false);
        }
      },
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "4rem 1rem", color: "#64748b" }}>
        <div style={{ display: "inline-block", width: "2.5rem", height: "2.5rem", border: "3px solid #cbd5e1", borderTopColor: "#086d7d", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ marginTop: "1rem", fontWeight: 600 }}>Loading platform configuration...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Platform Configuration & Governance</h1>
          <p className="admin-page-sub">
            Configure global operating rules, admission gates, moderation workflows, and public contact information.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ maxWidth: "52rem" }}>
        {/* Section 1: General Branding & Support */}
        <div className="admin-table-container" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
            General & Support Contacts
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label
                htmlFor="platform-name"
                style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}
              >
                Platform Name
              </label>
              <input
                id="platform-name"
                type="text"
                className="admin-search-input"
                style={{ width: "100%", boxSizing: "border-box" }}
                value={settings.platformName}
                onChange={(e) => handleChange("platformName", e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label
                  htmlFor="support-email"
                  style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}
                >
                  Official Support Email
                </label>
                <input
                  id="support-email"
                  type="email"
                  className="admin-search-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  value={settings.supportEmail}
                  onChange={(e) => handleChange("supportEmail", e.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="support-phone"
                  style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}
                >
                  Support Helpline
                </label>
                <input
                  id="support-phone"
                  type="text"
                  className="admin-search-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  value={settings.supportPhone}
                  onChange={(e) => handleChange("supportPhone", e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Admissions & Applications Control */}
        <div className="admin-table-container" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
            Admissions & Student Applications Gate
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.admissionsOpen}
                onChange={(e) => handleChange("admissionsOpen", e.target.checked)}
                style={{ width: "1.2rem", height: "1.2rem", marginTop: "0.2rem" }}
              />
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.925rem" }}>
                  Admissions Open Across Platform
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  When unchecked, students will receive notice that application submission is temporarily paused.
                </div>
              </div>
            </label>

            <div>
              <label
                htmlFor="admission-notice"
                style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}
              >
                Admissions Notice Banner
              </label>
              <textarea
                id="admission-notice"
                rows={2}
                className="admin-search-input"
                style={{ width: "100%", boxSizing: "border-box" }}
                value={settings.admissionDeadlineNotice}
                onChange={(e) => handleChange("admissionDeadlineNotice", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Institutes & Moderation Governance */}
        <div className="admin-table-container" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
          <h3 style={{ margin: "0 0 1.25rem", fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
            Institutional Quality & Moderation Gates
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.allowPublicInstituteSignup}
                onChange={(e) => handleChange("allowPublicInstituteSignup", e.target.checked)}
                style={{ width: "1.2rem", height: "1.2rem", marginTop: "0.2rem" }}
              />
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.925rem" }}>
                  Allow Public Institute Registration
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Allow colleges and academies to sign up for institutional accounts.
                </div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.requireCourseApproval}
                onChange={(e) => handleChange("requireCourseApproval", e.target.checked)}
                style={{ width: "1.2rem", height: "1.2rem", marginTop: "0.2rem" }}
              />
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.925rem" }}>
                  Require Admin Review for Course Listings
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Courses added by institutes must be approved by an administrator before appearing publicly.
                </div>
              </div>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={settings.requireReviewApproval}
                onChange={(e) => handleChange("requireReviewApproval", e.target.checked)}
                style={{ width: "1.2rem", height: "1.2rem", marginTop: "0.2rem" }}
              />
              <div>
                <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.925rem" }}>
                  Moderation Queue for Reported Content
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  Flagged reviews and courses automatically route to the administrative moderation queue.
                </div>
              </div>
            </label>

            <div>
              <label
                htmlFor="max-featured"
                style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}
              >
                Maximum Featured Institutes on Directory Homepage
              </label>
              <input
                id="max-featured"
                type="number"
                min="1"
                max="50"
                className="admin-search-input"
                style={{ width: "12rem" }}
                value={settings.maxFeaturedInstitutes}
                onChange={(e) => handleChange("maxFeaturedInstitutes", Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="submit"
            disabled={saving}
            className="admin-btn admin-btn-primary"
            style={{ padding: "0.75rem 1.75rem", fontSize: "0.95rem" }}
          >
            {saving ? "Saving Changes..." : "Save Platform Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
