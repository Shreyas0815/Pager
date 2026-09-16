// Central configuration for backend connectivity
// Priority: localStorage override > env variable > auto-detect > DEMO MODE

function getApiBase() {
  // 1. Check localStorage override
  const stored = localStorage.getItem('hpms_api_base');
  if (stored) return stored;

  // 2. Check build-time env variable
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE;

  // 3. If running on localhost, use local backend
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }

  // 4. Deployed (Vercel etc) — no backend available → demo mode
  return '';
}

export const API_BASE = getApiBase();
export const WS_BASE = API_BASE ? API_BASE.replace(/^http/, 'ws') : '';

// Demo mode: true when no backend is configured (deployed on Vercel without backend)
export function isDemoMode() {
  return !API_BASE;
}

export function isConfigured() {
  return !!API_BASE;
}

export function setApiBase(url) {
  localStorage.setItem('hpms_api_base', url);
  window.location.reload();
}

export function clearApiBase() {
  localStorage.removeItem('hpms_api_base');
  window.location.reload();
}
