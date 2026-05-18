// API configuration
export const API_BASE = 'http://localhost:3001';
export const WS_URL = 'ws://localhost:3001/ws';

// Vital sign thresholds for color coding
export const VITAL_THRESHOLDS = {
  heartRate: { low: 50, high: 120, criticalLow: 40, criticalHigh: 180 },
  spO2: { low: 92, criticalLow: 85 },
  systolicBP: { low: 90, high: 150, criticalLow: 70, criticalHigh: 200 },
  temperature: { low: 35.5, high: 38, criticalLow: 34, criticalHigh: 40 },
  respiratoryRate: { low: 10, high: 24, criticalLow: 8, criticalHigh: 30 },
};

// Colors
export const COLORS = {
  primary: '#0a0f1e',
  secondary: '#111827',
  card: '#1a2332',
  accent: '#00d4aa',
  accentDim: 'rgba(0, 212, 170, 0.15)',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  stable: '#00d4aa',
  warning: '#ffb020',
  critical: '#ff3b5c',
  text: '#f0f4f8',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  border: 'rgba(148, 163, 184, 0.15)',
  white: '#ffffff',
  background: '#f8fafc',
  cardLight: '#ffffff',
  borderLight: '#e2e8f0',
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
