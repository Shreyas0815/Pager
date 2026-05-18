// Central configuration for backend connectivity
// Priority: localStorage override > env variable > auto-detect
function getApiBase() {
  // 1. Check localStorage override (set by user or settings page)
  const stored = localStorage.getItem('hpms_api_base');
  if (stored) return stored;

  // 2. Check build-time env variable
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;

  // 3. If running on localhost (dev), use local backend
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }

  // 4. For deployed versions (Vercel etc), use the stored tunnel/backend URL
  // If none set, return empty and the app will show a config prompt
  return '';
}

export const API_BASE = getApiBase();
export const WS_BASE = API_BASE ? API_BASE.replace(/^http/, 'ws') : '';

export function setApiBase(url) {
  localStorage.setItem('hpms_api_base', url);
  window.location.reload();
}

export function clearApiBase() {
  localStorage.removeItem('hpms_api_base');
  window.location.reload();
}

export function isConfigured() {
  return !!API_BASE;
}
