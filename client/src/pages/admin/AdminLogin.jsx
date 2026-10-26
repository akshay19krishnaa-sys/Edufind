import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import "../../styles/Admin.css";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { isAuthenticated, login } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please provide both administrator email and password.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/admin/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid administrator credentials");
      }

      if (!data.token) {
        throw new Error(data.message || "Authentication token not provided by server.");
      }

      login(data.token, data.admin);
      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Failed to authenticate. Please check server connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "28rem",
          backgroundColor: "#ffffff",
          borderRadius: "1rem",
          border: "1px solid #e2e8f0",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)",
          padding: "2.5rem 2rem",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "3.5rem",
              height: "3.5rem",
              borderRadius: "0.75rem",
              backgroundColor: "#e0f2fe",
              color: "#086d7d",
              marginBottom: "1rem",
            }}
          >
            <svg style={{ width: "2rem", height: "2rem" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#173b5e", margin: 0, letterSpacing: "-0.02em" }}>
            EduFind Control Center
          </h1>
          <p style={{ margin: "0.35rem 0 0", color: "#64748b", fontSize: "0.875rem" }}>
            Authorized platform administrators only
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: "0.85rem 1rem",
              borderRadius: "0.5rem",
              backgroundColor: "#ffe4e6",
              border: "1px solid #fecdd3",
              color: "#be123c",
              fontSize: "0.875rem",
              fontWeight: 500,
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <svg style={{ width: "1.25rem", height: "1.25rem", flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label
              htmlFor="admin-email"
              style={{ display: "block", fontSize: "0.825rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}
            >
              Administrator Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@edufind.com"
              style={{
                width: "100%",
                padding: "0.7rem 0.9rem",
                borderRadius: "0.5rem",
                border: "1.5px solid #cbd5e1",
                outline: "none",
                fontSize: "0.925rem",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#086d7d")}
              onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
              <label
                htmlFor="admin-password"
                style={{ fontSize: "0.825rem", fontWeight: 700, color: "#334155" }}
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#086d7d",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              style={{
                width: "100%",
                padding: "0.7rem 0.9rem",
                borderRadius: "0.5rem",
                border: "1.5px solid #cbd5e1",
                outline: "none",
                fontSize: "0.925rem",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#086d7d")}
              onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="admin-btn admin-btn-primary"
            style={{
              padding: "0.85rem",
              fontSize: "0.95rem",
              borderRadius: "0.5rem",
              marginTop: "0.5rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Authenticating..." : "Sign in to Control Panel"}
          </button>
        </form>

        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1.25rem",
            borderTop: "1px solid #f1f5f9",
            textAlign: "center",
            fontSize: "0.78rem",
            color: "#94a3b8",
            lineHeight: 1.4,
          }}
        >
          Administrative accounts are securely provisioned via server environment variables. Public registration is disabled.
        </div>
      </div>
    </div>
  );
}
