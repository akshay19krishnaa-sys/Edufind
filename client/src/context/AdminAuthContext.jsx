import { createContext, useContext, useState, useCallback, useMemo } from "react";

export const ADMIN_TOKEN_KEY = "edufind_admin_token";
export const ADMIN_DATA_KEY = "edufind_admin";

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (base64.length % 4 !== 0) {
      base64 += "=";
    }
    const decoded = atob(base64);
    try {
      return JSON.parse(
        decodeURIComponent(
          Array.prototype.map
            .call(decoded, (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        )
      );
    } catch {
      return JSON.parse(decoded);
    }
  } catch {
    return null;
  }
}

function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return true;
  if (typeof payload.exp === "number") {
    return Date.now() / 1000 > payload.exp;
  }
  return false;
}

function readAdminStorage() {
  try {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      localStorage.removeItem(ADMIN_DATA_KEY);
      return { token: null, admin: null };
    }

    const payload = decodeJwtPayload(token);
    const raw = localStorage.getItem(ADMIN_DATA_KEY);
    let admin = null;
    if (raw) {
      try {
        admin = JSON.parse(raw);
      } catch {
        admin = null;
      }
    }

    if (!admin) {
      admin = {
        _id: payload?.id || "",
        id: payload?.id || "",
        role: "admin",
        isSuperAdmin: Boolean(payload?.isSuperAdmin),
      };
      localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(admin));
    }

    if (admin && !admin.role) {
      admin.role = "admin";
      localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(admin));
    }

    return { token, admin };
  } catch {
    return { token: null, admin: null };
  }
}

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [auth, setAuth] = useState(readAdminStorage);

  const login = useCallback((token, adminData) => {
    const payload = decodeJwtPayload(token);
    const resolvedAdmin = adminData
      ? { ...adminData, role: "admin" }
      : {
          _id: payload?.id || "",
          id: payload?.id || "",
          role: "admin",
          isSuperAdmin: Boolean(payload?.isSuperAdmin),
        };

    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_DATA_KEY, JSON.stringify(resolvedAdmin));
    setAuth({ token, admin: resolvedAdmin });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_DATA_KEY);
    setAuth({ token: null, admin: null });
  }, []);

  const isAuthenticated = useMemo(() => {
    if (auth.token && auth.admin && auth.admin.role === "admin") {
      return true;
    }
    const storedToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (storedToken && !isTokenExpired(storedToken)) {
      return true;
    }
    return false;
  }, [auth.token, auth.admin]);

  const value = useMemo(
    () => ({
      token: auth.token,
      admin: auth.admin,
      isAuthenticated,
      login,
      logout,
    }),
    [auth.token, auth.admin, isAuthenticated, login, logout]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  }
  return ctx;
}
