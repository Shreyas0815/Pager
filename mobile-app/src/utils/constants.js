// API configuration — auto-discovery
// The app will scan common ports on the local network to find the server
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default fallback
const DEFAULT_API = 'http://localhost:3001';
const DEFAULT_WS = 'ws://localhost:3001/ws';

let _apiBase = DEFAULT_API;
let _wsUrl = DEFAULT_WS;

// Attempt to discover the server on the local network
export async function discoverServer() {
  // Check if user manually set a server URL
  const saved = await AsyncStorage.getItem('hpms_server_url');
  if (saved) {
    _apiBase = saved;
    _wsUrl = saved.replace(/^http/, 'ws') + '/ws';
    return true;
  }

  // On web, use current origin or localhost
  if (Platform.OS === 'web') {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      // Deployed — use localhost as fallback
      _apiBase = DEFAULT_API;
      _wsUrl = DEFAULT_WS;
    }
    return true;
  }

  // On mobile, try common local IPs
  // Android emulator uses 10.0.2.2 for host machine
  const candidates = [
    'http://10.0.2.2:3001',      // Android emulator
    'http://192.168.1.1:3001',    // Common router subnet
    'http://localhost:3001',
  ];

  // Also scan 192.168.x.x range common for home networks
  for (let subnet of [1, 0, 2, 43, 29]) {
    for (let host = 2; host <= 20; host++) {
      candidates.push(`http://192.168.${subnet}.${host}:3001`);
    }
  }

  for (const url of candidates) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 800);
      const res = await fetch(`${url}/api/system/health`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'HEALTHY') {
          _apiBase = url;
          _wsUrl = url.replace(/^http/, 'ws') + '/ws';
          await AsyncStorage.setItem('hpms_server_url', url);
          console.log(`[Discovery] Found server at ${url}`);
          return true;
        }
      }
    } catch (e) {
      // skip
    }
  }
  return false;
}

export async function setServerUrl(url) {
  _apiBase = url;
  _wsUrl = url.replace(/^http/, 'ws') + '/ws';
  await AsyncStorage.setItem('hpms_server_url', url);
}

export async function clearServerUrl() {
  await AsyncStorage.removeItem('hpms_server_url');
  _apiBase = DEFAULT_API;
  _wsUrl = DEFAULT_WS;
}

export function getApiBase() { return _apiBase; }
export function getWsUrl() { return _wsUrl; }

// Legacy exports for compatibility
export const API_BASE = DEFAULT_API;
export const WS_URL = DEFAULT_WS;

// Vital sign thresholds for color coding
export const VITAL_THRESHOLDS = {
  heartRate: { low: 50, high: 120, criticalLow: 40, criticalHigh: 180 },
  spO2: { low: 92, criticalLow: 85 },
  systolicBP: { low: 90, high: 150, criticalLow: 70, criticalHigh: 200 },
  temperature: { low: 35.5, high: 38, criticalLow: 34, criticalHigh: 40 },
  respiratoryRate: { low: 10, high: 24, criticalLow: 8, criticalHigh: 30 },
};

// Colors — White & Dark Navy Blue (matching admin dashboard)
export const COLORS = {
  primary: '#0f172a',
  secondary: '#1e293b',
  card: '#1e3a5f',
  accent: '#1e40af',
  accentDim: 'rgba(30, 64, 175, 0.12)',
  blue: '#2563eb',
  purple: '#6d28d9',
  stable: '#059669',
  warning: '#d97706',
  critical: '#dc2626',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: 'rgba(15, 23, 42, 0.08)',
  white: '#ffffff',
  background: '#f4f7fc',
  cardLight: '#ffffff',
  borderLight: '#e2e8f0',
  navyDark: '#0f1b3d',
};

export const getVitalStatus = (type, value) => {
  const th = VITAL_THRESHOLDS[type];
  if (!th || value === null || value === undefined) return 'normal';
  
  if (th.criticalHigh && value > th.criticalHigh) return 'critical';
  if (th.criticalLow && value < th.criticalLow) return 'critical';
  if (th.high && value > th.high) return 'warning';
  if (th.low && value < th.low) return 'warning';
  return 'normal';
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'critical': case 'CRITICAL': return COLORS.critical;
    case 'warning': case 'WARNING': return COLORS.warning;
    case 'stable': case 'STABLE': case 'normal': return COLORS.stable;
    default: return COLORS.textMuted;
  }
};
