// ═══════════════════════════════════════════════════════════
//  HPMS Demo Engine — Simulates the real-time backend
//  Generates vitals, triggers alerts, updates equipment
//  All runs client-side with setInterval callbacks
// ═══════════════════════════════════════════════════════════

import { demoPatients, demoEquipment, demoStaff, demoUser, nextAlertId } from './demoData.js';

// ─── Internal state ──────────────────────────────────────
let _alerts = [];
let _processedCount = 0;
let _alertsTriggered = 0;
let _notificationsSent = 0;
let _startTime = Date.now();
let _vitalHistory = {};  // patientId -> [{vitals}]
let _listeners = { vitals: [], alerts: [], system: [], equipment: [] };
let _intervals = [];

// ─── Vital Sign Generator ────────────────────────────────
function generateVitals(patient) {
  const b = patient._baseline;
  // Add Gaussian-ish noise: occasional spikes for CRITICAL/WARNING patients
  const noise = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2;
  const spike = patient.status === 'CRITICAL' ? 0.12 : patient.status === 'WARNING' ? 0.06 : 0.01;
  const isSpike = Math.random() < spike;

  const hr = Math.round(b.heartRate + noise() * 8 + (isSpike ? (Math.random() > 0.5 ? 25 : -20) : 0));
  const spo2 = Math.min(100, Math.max(70, Math.round(b.spO2 + noise() * 2 + (isSpike ? -6 : 0))));
  const sys = Math.round(b.systolicBP + noise() * 10 + (isSpike ? 30 : 0));
  const dia = Math.round(b.diastolicBP + noise() * 6 + (isSpike ? 15 : 0));
  const temp = parseFloat((b.temperature + noise() * 0.3 + (isSpike ? 1.2 : 0)).toFixed(1));
  const rr = Math.round(b.respiratoryRate + noise() * 3);

  return {
    patientId: patient.id,
    heartRate: Math.max(30, Math.min(220, hr)),
    spO2: Math.max(70, Math.min(100, spo2)),
    systolicBP: Math.max(60, Math.min(250, sys)),
    diastolicBP: Math.max(30, Math.min(150, dia)),
    temperature: Math.max(34, Math.min(42, temp)),
    respiratoryRate: Math.max(8, Math.min(40, rr)),
    timestamp: new Date().toISOString(),
  };
}

// ─── Alert Checker ───────────────────────────────────────
function checkAlerts(vitals, patient) {
  const alerts = [];
  const check = (label, value, low, high, unit) => {
    if (value > high) {
      alerts.push({
        severity: value > high * 1.1 ? 'CRITICAL' : 'WARNING',
        message: `${label} HIGH: ${value}${unit} (threshold: ${high}${unit})`,
      });
    }
    if (low && value < low) {
      alerts.push({
        severity: value < low * 0.9 ? 'CRITICAL' : 'WARNING',
        message: `${label} LOW: ${value}${unit} (threshold: ${low}${unit})`,
      });
    }
  };

  check('Heart Rate', vitals.heartRate, patient.thresholdHRLow, patient.thresholdHRHigh, ' bpm');
  check('SpO2', vitals.spO2, patient.thresholdSpO2Low, 100, '%');
  check('Systolic BP', vitals.systolicBP, patient.thresholdBPSysLow, patient.thresholdBPSysHigh, ' mmHg');
  check('Temperature', vitals.temperature, patient.thresholdTempLow, patient.thresholdTempHigh, '°C');

  return alerts;
}

// ─── Main Tick (called every 2s) ─────────────────────────
function tick() {
  demoPatients.forEach(patient => {
    const vitals = generateVitals(patient);
    _processedCount++;

    // Store history
    if (!_vitalHistory[patient.id]) _vitalHistory[patient.id] = [];
    _vitalHistory[patient.id].push(vitals);
    if (_vitalHistory[patient.id].length > 120) _vitalHistory[patient.id].shift();

    // Emit vitals to listeners
    _listeners.vitals.forEach(fn => fn(vitals));

    // Check for alerts
    const triggered = checkAlerts(vitals, patient);
    triggered.forEach(alertInfo => {
      const alert = {
        id: nextAlertId(),
        severity: alertInfo.severity,
        message: alertInfo.message,
        patientId: patient.id,
        patientName: patient.name,
        bedNumber: patient.bedNumber,
        ward: patient.ward,
        acknowledged: false,
        acknowledgedBy: null,
        createdAt: new Date().toISOString(),
        patient: { name: patient.name, bedNumber: patient.bedNumber, ward: patient.ward },
      };
      _alerts.unshift(alert);
      if (_alerts.length > 500) _alerts.pop();
      _alertsTriggered++;
      _notificationsSent++;

      // Emit alert
      _listeners.alerts.forEach(fn => fn(alert));
    });
  });

  // Randomly toggle 1 device status
  if (Math.random() < 0.02) {
    const idx = Math.floor(Math.random() * demoEquipment.length);
    demoEquipment[idx].status = demoEquipment[idx].status === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    demoEquipment[idx].lastPingAt = new Date().toISOString();
  }
  // Update all lastPingAt
  demoEquipment.forEach(e => {
    if (e.status === 'ONLINE') e.lastPingAt = new Date().toISOString();
  });
}

// ─── Public API — matches real backend responses ─────────

export function demoStart() {
  _startTime = Date.now();
  // Generate initial seed alerts
  for (let i = 0; i < 30; i++) {
    const patient = demoPatients[Math.floor(Math.random() * demoPatients.length)];
    const vitals = generateVitals(patient);
    const triggered = checkAlerts(vitals, patient);
    triggered.forEach(alertInfo => {
      _alerts.push({
        id: nextAlertId(),
        severity: alertInfo.severity,
        message: alertInfo.message,
        patientId: patient.id,
        patientName: patient.name,
        bedNumber: patient.bedNumber,
        ward: patient.ward,
        acknowledged: Math.random() > 0.6,
        acknowledgedBy: Math.random() > 0.5 ? { name: 'Dr. Sarah Smith' } : null,
        createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
        patient: { name: patient.name, bedNumber: patient.bedNumber, ward: patient.ward },
      });
    });
    _processedCount++;
  }
  _alertsTriggered = _alerts.length;

  // Start simulation loop
  const id = setInterval(tick, 2000);
  _intervals.push(id);
  // Generate first tick immediately
  tick();
}

export function demoStop() {
  _intervals.forEach(clearInterval);
  _intervals = [];
}

export function demoOnVitals(fn)     { _listeners.vitals.push(fn);    return () => { _listeners.vitals = _listeners.vitals.filter(f => f !== fn); }; }
export function demoOnAlert(fn)      { _listeners.alerts.push(fn);    return () => { _listeners.alerts = _listeners.alerts.filter(f => f !== fn); }; }

// ─── API Response Simulators ─────────────────────────────

export function demoLogin(email, password) {
  if (email === 'admin@hospital.com' && password === 'password123') {
    return { token: 'demo-jwt-token-' + Date.now(), user: demoUser };
  }
  if (email === 'dr.smith@hospital.com' && password === 'password123') {
    return { token: 'demo-jwt-token-' + Date.now(), user: { ...demoUser, id: 'usr-doc-001', name: 'Dr. Sarah Smith', role: 'DOCTOR', department: 'Cardiology' } };
  }
  throw new Error('Invalid email or password');
}

export function demoGetPatients() {
  return demoPatients.map(p => {
    const { _baseline, ...rest } = p;
    return rest;
  });
}

export function demoGetPatient(id) {
  const p = demoPatients.find(p => p.id === id);
  if (!p) throw new Error('Patient not found');
  const { _baseline, ...rest } = p;
  return rest;
}

export function demoGetPatientVitals(id) {
  return (_vitalHistory[id] || []).slice(-60).map(v => ({ ...v }));
}

export function demoGetAlerts(params = {}) {
  let result = [..._alerts];
  if (params.severity) result = result.filter(a => a.severity === params.severity);
  if (params.acknowledged === 'false') result = result.filter(a => !a.acknowledged);
  if (params.patientId) result = result.filter(a => a.patientId === params.patientId);
  return result.slice(0, parseInt(params.limit) || 100);
}

export function demoGetAlertsSummary() {
  const total = _alerts.length;
  const critical = _alerts.filter(a => a.severity === 'CRITICAL' && !a.acknowledged).length;
  const warning = _alerts.filter(a => a.severity === 'WARNING' && !a.acknowledged).length;
  const unacknowledged = _alerts.filter(a => !a.acknowledged).length;
  const hourAgo = Date.now() - 3600000;
  const recentCount = _alerts.filter(a => new Date(a.createdAt).getTime() > hourAgo).length;
  return { total, critical, warning, unacknowledged, recentCount };
}

export function demoAcknowledgeAlert(id) {
  const alert = _alerts.find(a => a.id === id);
  if (alert) {
    alert.acknowledged = true;
    alert.acknowledgedBy = { name: demoUser.name };
  }
  return { success: true };
}

export function demoGetEquipment() {
  return [...demoEquipment];
}

export function demoGetEquipmentStatus() {
  const total = demoEquipment.length;
  const online = demoEquipment.filter(e => e.status === 'ONLINE').length;
  const offline = demoEquipment.filter(e => e.status === 'OFFLINE').length;
  const error = demoEquipment.filter(e => e.status === 'ERROR').length;
  return { total, online, offline, error, healthPercentage: Math.round((online / total) * 100) };
}

export function demoGetStaff() {
  return demoStaff;
}

export function demoGenerateReport(patientId) {
  const patient = demoPatients.find(p => p.id === patientId);
  if (!patient) throw new Error('Patient not found');
  const history = _vitalHistory[patientId] || [];
  const calc = (key) => {
    const vals = history.map(v => v[key]).filter(Boolean);
    if (vals.length === 0) return { avg: '--', min: '--', max: '--' };
    return {
      avg: (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1),
      min: Math.min(...vals).toFixed(1),
      max: Math.max(...vals).toFixed(1),
    };
  };
  return {
    data: {
      lastHourStats: {
        heartRate: calc('heartRate'),
        spO2: calc('spO2'),
        systolicBP: calc('systolicBP'),
        diastolicBP: calc('diastolicBP'),
        temperature: calc('temperature'),
        respiratoryRate: calc('respiratoryRate'),
      },
      trends: {
        heartRate: { direction: 'STABLE', percentChange: (Math.random() * 4 - 2).toFixed(1) },
        spO2: { direction: 'STABLE', percentChange: (Math.random() * 2 - 1).toFixed(1) },
        systolicBP: { direction: patient.status === 'CRITICAL' ? 'INCREASING' : 'STABLE', percentChange: (Math.random() * 6 - 2).toFixed(1) },
        temperature: { direction: 'STABLE', percentChange: (Math.random() * 2 - 1).toFixed(1) },
      },
      alertCount: _alerts.filter(a => a.patientId === patientId).length,
      generatedAt: new Date().toISOString(),
    },
  };
}

export function demoGetSystemHealth() {
  const uptime = Math.floor((Date.now() - _startTime) / 1000);
  const hours = Math.floor(uptime / 3600);
  const mins = Math.floor((uptime % 3600) / 60);
  const secs = uptime % 60;
  return {
    status: 'HEALTHY',
    uptimeFormatted: `${hours}h ${mins}m ${secs}s`,
    connectedClients: 2,
    servers: {
      primary: { status: 'ACTIVE', cpu: `${(12 + Math.random() * 15).toFixed(1)}%`, memory: `${(35 + Math.random() * 10).toFixed(1)}%`, uptime },
      backup:  { status: 'STANDBY', cpu: `${(3 + Math.random() * 5).toFixed(1)}%`, memory: `${(20 + Math.random() * 8).toFixed(1)}%`, uptime },
    },
    database: {
      primary: { status: 'ACTIVE', replicationLag: `${Math.floor(Math.random() * 50)}ms` },
      backup:  { status: 'SYNCED', replicationLag: `${Math.floor(Math.random() * 120)}ms` },
    },
    services: {
      streamProcessor: { status: 'RUNNING', processedCount: _processedCount },
      alertingEngine: { status: 'RUNNING', alertsTriggered: _alertsTriggered },
      notificationGateway: { status: 'RUNNING', sentCount: _notificationsSent },
    },
  };
}

export function demoGetSystemClients() {
  return [
    { id: 'client-admin-dashboard-' + Math.random().toString(36).slice(2), user: { name: 'Dr. Admin', role: 'ADMIN' }, subscriptions: ['vitals', 'alerts', 'system-health'] },
    { id: 'client-mobile-app-' + Math.random().toString(36).slice(2), user: { name: 'Dr. Sarah Smith', role: 'DOCTOR' }, subscriptions: ['vitals', 'alerts'] },
  ];
}

export function demoGetNotifications() {
  return _alerts.slice(0, 10).map(a => ({
    id: a.id,
    type: 'CRITICAL_ALERT',
    message: a.message,
    read: a.acknowledged,
    createdAt: a.createdAt,
  }));
}
