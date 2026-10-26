import { createContext, useContext, useState, useCallback } from "react";

// ─── Storage keys ─────────────────────────────────────────────────────────────
// These are the only keys used to persist student auth state.
// Institute and admin auth must use different keys — never cleared here.
export const STUDENT_TOKEN_KEY = "edufind_student_token";
export const STUDENT_DATA_KEY  = "edufind_student";

// ─── JWT helpers (no external library needed) ─────────────────────────────────

/** Decode the JWT payload from Base64Url — reads claims, does NOT verify signature. */
function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonStr);
  } catch {
    try {
      const parts = token.split(".");
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      return JSON.parse(atob(base64));
    } catch {
      return null;
    }
  }
}

/** Returns true if the token is missing or its exp claim is in the past. */
function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload) return true;
  if (typeof payload.exp === "number") {
    return Date.now() / 1000 > payload.exp;
  }
  return false;
}

// ─── Bootstrap: load auth state from localStorage ────────────────────────────

function readStorage() {
  try {
    const token = localStorage.getItem(STUDENT_TOKEN_KEY);

    // No token or token is expired → clear storage and return unauthenticated
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem(STUDENT_TOKEN_KEY);
      localStorage.removeItem(STUDENT_DATA_KEY);
      return { token: null, student: null };
    }

    const payload = decodeJwtPayload(token);

    // Safety: If token payload explicitly has a non-student role (e.g. "institute"), do not use for student auth
    if (payload?.role && payload.role !== "student") {
      localStorage.removeItem(STUDENT_TOKEN_KEY);
      localStorage.removeItem(STUDENT_DATA_KEY);
      return { token: null, student: null };
    }

    const raw = localStorage.getItem(STUDENT_DATA_KEY);
    let student = null;
    if (raw) {
      try {
        student = JSON.parse(raw);
      } catch {
        student = null;
      }
    }

    // If student object is missing or lacks role, reconstruct/enrich from token payload
    if (!student) {
      student = {
        _id: payload?.id || "",
        id: payload?.id || "",
        role: payload?.role || "student",
      };
      localStorage.setItem(STUDENT_DATA_KEY, JSON.stringify(student));
    } else if (!student.role) {
      student.role = payload?.role || "student";
      localStorage.setItem(STUDENT_DATA_KEY, JSON.stringify(student));
    }

    return { token, student };
  } catch {
    return { token: null, student: null };
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialise from localStorage once on mount (lazy initialiser)
  const [auth, setAuth] = useState(readStorage);

  /**
   * Call after a successful login or registration.
   * Persists token and student object to localStorage and updates React state.
   */
  const login = useCallback((token, studentData) => {
    const payload = decodeJwtPayload(token);
    const resolvedStudent = studentData
      ? {
          ...studentData,
          role: studentData.role || payload?.role || "student",
        }
      : {
          _id: payload?.id || "",
          id: payload?.id || "",
          role: payload?.role || "student",
        };

    localStorage.setItem(STUDENT_TOKEN_KEY, token);
    localStorage.setItem(STUDENT_DATA_KEY, JSON.stringify(resolvedStudent));
    setAuth({ token, student: resolvedStudent });
  }, []);

  /**
   * Call on logout.
   * Only clears student keys — does NOT touch institute or admin auth.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(STUDENT_TOKEN_KEY);
    localStorage.removeItem(STUDENT_DATA_KEY);
    setAuth({ token: null, student: null });
  }, []);

  const value = {
    token:           auth.token,
    student:         auth.student,
    isAuthenticated: Boolean(auth.token && auth.student && auth.student.role === "student"),
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook — throws if used outside <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
