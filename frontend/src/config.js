export const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL ||
  // If served from the same origin as backend (e.g., /api proxied), use window.location.origin
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');
