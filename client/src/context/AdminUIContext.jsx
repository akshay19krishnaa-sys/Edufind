import { createContext, useContext, useState, useCallback } from "react";

const AdminUIContext = createContext(null);

export function AdminUIProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null);

  const showToast = useCallback((type, message) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const confirmAction = useCallback(
    ({ title, message, confirmText = "Confirm", isDanger = false, onConfirm }) => {
      setConfirmModal({
        title,
        message,
        confirmText,
        isDanger,
        onConfirm: async () => {
          try {
            await onConfirm();
          } finally {
            setConfirmModal(null);
          }
        },
      });
    },
    []
  );

  const closeConfirmModal = useCallback(() => {
    setConfirmModal(null);
  }, []);

  return (
    <AdminUIContext.Provider value={{ showToast, confirmAction }}>
      {children}

      {/* Global Admin Toast Container */}
      {toasts.length > 0 && (
        <div className="admin-toast-container" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`admin-toast ${t.type === "error" ? "admin-toast--error" : "admin-toast--success"}`}
            >
              {t.type === "error" ? (
                <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="admin-nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              )}
              <span>{t.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Global Confirmation Modal */}
      {confirmModal && (
        <div className="admin-modal-backdrop" onClick={closeConfirmModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{confirmModal.title}</h3>
              <button
                type="button"
                className="admin-btn-secondary"
                style={{ padding: "0.25rem 0.5rem", borderRadius: "0.25rem", border: "none", cursor: "pointer" }}
                onClick={closeConfirmModal}
              >
                ✕
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ margin: 0, color: "#475569", lineHeight: 1.5, fontSize: "0.925rem" }}>
                {confirmModal.message}
              </p>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={closeConfirmModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`admin-btn ${confirmModal.isDanger ? "admin-btn-danger" : "admin-btn-primary"}`}
                onClick={confirmModal.onConfirm}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminUIContext.Provider>
  );
}

export function useAdminUI() {
  const ctx = useContext(AdminUIContext);
  if (!ctx) {
    throw new Error("useAdminUI must be used inside <AdminUIProvider>");
  }
  return ctx;
}
