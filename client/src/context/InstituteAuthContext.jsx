import { createContext, useContext, useState, useCallback } from "react";

// ─── Storage keys ─────────────────────────────────────────────────────────────
// Dedicated keys for institute authentication.
// Student session keys are completely untouched by institute login/logout.
export const INSTITUTE_TOKEN_KEY = "edufind_institute_token";
export const INSTITUTE_DATA_KEY  = "edufind_institute";

// ─── JWT helpers ──────────────────────────────────────────────────────────────

/** Decode JWT payload to read expiration timestamp */
function decodeJwtPayload(token) {
  try {
    const segment = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(segment));
  } catch {
    return null;
  }
}

/** Returns true if token is missing or expired */
function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return Date.now() / 1000 > payload.exp;
}

// ─── Bootstrap from localStorage ──────────────────────────────────────────────

function readInstituteStorage() {
  try {
    const token = localStorage.getItem(INSTITUTE_TOKEN_KEY);

    if (!token || isTokenExpired(token)) {
      localStorage.removeItem(INSTITUTE_TOKEN_KEY);
      localStorage.removeItem(INSTITUTE_DATA_KEY);
      return { token: null, institute: null };
    }

    const raw = localStorage.getItem(INSTITUTE_DATA_KEY);
    const institute = raw ? JSON.parse(raw) : null;
    return { token, institute };
  } catch {
    return { token: null, institute: null };
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const InstituteAuthContext = createContext(null);

export function InstituteAuthProvider({ children }) {
  const [auth, setAuth] = useState(readInstituteStorage);

  /**
   * Call after successful institute login.
   * Persists token and institute profile to localStorage and React state.
   */
  const login = useCallback((token, instituteData) => {
    localStorage.setItem(INSTITUTE_TOKEN_KEY, token);
    localStorage.setItem(INSTITUTE_DATA_KEY, JSON.stringify(instituteData));
    setAuth({ token, institute: instituteData });
  }, []);

  /**
   * Call on institute logout.
   * ONLY clears institute storage keys. Does NOT touch student auth state.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(INSTITUTE_TOKEN_KEY);
    localStorage.removeItem(INSTITUTE_DATA_KEY);
    setAuth({ token: null, institute: null });
  }, []);

  /**
   * Update stored institute profile without modifying token.
   */
  const updateInstitute = useCallback((updatedInstitute) => {
    localStorage.setItem(INSTITUTE_DATA_KEY, JSON.stringify(updatedInstitute));
    setAuth((prev) => ({ ...prev, institute: updatedInstitute }));
  }, []);

  const value = {
    token:           auth.token,
    institute:       auth.institute,
    isAuthenticated: Boolean(auth.token),
    login,
    logout,
    updateInstitute,
  };

  return (
    <InstituteAuthContext.Provider value={value}>
      {children}
    </InstituteAuthContext.Provider>
  );
}

/** Hook to consume InstituteAuthContext */
export function useInstituteAuth() {
  const ctx = useContext(InstituteAuthContext);
  if (!ctx) {
    throw new Error("useInstituteAuth must be used inside <InstituteAuthProvider>");
  }
  return ctx;
}
