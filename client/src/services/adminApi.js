import { ADMIN_TOKEN_KEY, ADMIN_DATA_KEY } from "../context/AdminAuthContext";

const API_BASE = "http://localhost:5000/api/admin";

export async function adminFetch(endpoint, options = {}) {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_DATA_KEY);
    if (window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login") {
      window.location.href = "/admin/login";
    }
  }

  return response;
}
