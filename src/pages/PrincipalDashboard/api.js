// ─────────────────────────────────────────────────────────────
// API CONFIG
// ─────────────────────────────────────────────────────────────
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export const getToken = () => localStorage.getItem('principalToken') ?? '';

export const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API_BASE}/principal${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json();
};