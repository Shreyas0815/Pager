// ═══════════════════════════════════════════════════════════
//  HPMS Demo Data — Self-Contained In-Memory Dataset
//  Matches exact shapes returned by the real backend API
// ═══════════════════════════════════════════════════════════

let _alertIdCounter = 1000;
export function nextAlertId() { return `alert-${++_alertIdCounter}`; }

export const demoUser = {
  id: 'usr-admin-001',
  name: 'Dr. Admin',
  email: 'admin@hospital.com',
  role: 'ADMIN',
  department: 'Administration',
};

export const demoPatients = [
  {
    id: 'pat-001', name: 'Robert Johnson', age: 67, gender: 'Male',
    bedNumber: 'ICU-101', ward: 'ICU', status: 'CRITICAL',
    diagnosis: 'Acute Myocardial Infarction',
    admittedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    thresholdHRHigh: 150, thresholdHRLow: 45,
    thresholdSpO2Low: 88, thresholdBPSysHigh: 180, thresholdBPSysLow: 80,
    thresholdTempHigh: 39.5, thresholdTempLow: 35,
    _count: { alerts: 24 },
    assignments: [
      { id: 'a1', role: 'PRIMARY_DOCTOR', staff: { name: 'Dr. Sarah Smith', department: 'Cardiology' } },
      { id: 'a2', role: 'NURSE', staff: { name: 'Nurse Emily Davis', department: 'ICU' } },
    ],
    // Baseline vitals for simulation (mean values)
    _baseline: { heartRate: 92, spO2: 93, systolicBP: 155, diastolicBP: 95, temperature: 37.8, respiratoryRate: 22 },
  },
  {
    id: 'pat-002', name: 'Maria Garcia', age: 54, gender: 'Female',
    bedNumber: 'ICU-102', ward: 'ICU', status: 'WARNING',
    diagnosis: 'Severe Pneumonia',
    admittedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    thresholdHRHigh: 140, thresholdHRLow: 50,
    thresholdSpO2Low: 90, thresholdBPSysHigh: 170, thresholdBPSysLow: 85,
    thresholdTempHigh: 39, thresholdTempLow: 35.5,
    _count: { alerts: 15 },
    assignments: [
      { id: 'a3', role: 'PRIMARY_DOCTOR', staff: { name: 'Dr. James Wilson', department: 'Pulmonology' } },
      { id: 'a4', role: 'NURSE', staff: { name: 'Nurse Michael Brown', department: 'ICU' } },
    ],
    _baseline: { heartRate: 88, spO2: 94, systolicBP: 130, diastolicBP: 82, temperature: 38.2, respiratoryRate: 24 },
  },
  {
    id: 'pat-003', name: 'James Williams', age: 72, gender: 'Male',
    bedNumber: 'CCU-201', ward: 'CCU', status: 'WARNING',
    diagnosis: 'Congestive Heart Failure',
    admittedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    thresholdHRHigh: 130, thresholdHRLow: 50,
    thresholdSpO2Low: 90, thresholdBPSysHigh: 160, thresholdBPSysLow: 90,
    thresholdTempHigh: 38.5, thresholdTempLow: 35.5,
    _count: { alerts: 12 },
    assignments: [
      { id: 'a5', role: 'PRIMARY_DOCTOR', staff: { name: 'Dr. Sarah Smith', department: 'Cardiology' } },
    ],
    _baseline: { heartRate: 78, spO2: 95, systolicBP: 142, diastolicBP: 88, temperature: 37.1, respiratoryRate: 20 },
  },
  {
    id: 'pat-004', name: 'Emily Chen', age: 34, gender: 'Female',
    bedNumber: 'W3-301', ward: 'Ward 3', status: 'STABLE',
    diagnosis: 'Post-Appendectomy Recovery',
    admittedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    thresholdHRHigh: 160, thresholdHRLow: 40,
    thresholdSpO2Low: 92, thresholdBPSysHigh: 180, thresholdBPSysLow: 80,
    thresholdTempHigh: 39, thresholdTempLow: 35,
    _count: { alerts: 2 },
    assignments: [
      { id: 'a6', role: 'PRIMARY_DOCTOR', staff: { name: 'Dr. James Wilson', department: 'General Surgery' } },
    ],
    _baseline: { heartRate: 72, spO2: 98, systolicBP: 118, diastolicBP: 75, temperature: 36.8, respiratoryRate: 16 },
  },
  {
    id: 'pat-005', name: 'David Kim', age: 61, gender: 'Male',
    bedNumber: 'ICU-103', ward: 'ICU', status: 'WARNING',
    diagnosis: 'Diabetic Ketoacidosis',
    admittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    thresholdHRHigh: 140, thresholdHRLow: 50,
    thresholdSpO2Low: 90, thresholdBPSysHigh: 170, thresholdBPSysLow: 85,
    thresholdTempHigh: 39, thresholdTempLow: 35,
    _count: { alerts: 18 },
    assignments: [
      { id: 'a7', role: 'PRIMARY_DOCTOR', staff: { name: 'Dr. Sarah Smith', department: 'Endocrinology' } },
      { id: 'a8', role: 'NURSE', staff: { name: 'Nurse Emily Davis', department: 'ICU' } },
    ],
    _baseline: { heartRate: 96, spO2: 94, systolicBP: 148, diastolicBP: 92, temperature: 37.5, respiratoryRate: 22 },
  },
  {
    id: 'pat-006', name: 'Sarah Thompson', age: 45, gender: 'Female',
    bedNumber: 'W2-205', ward: 'Ward 2', status: 'STABLE',
    diagnosis: 'Observation after Syncope',
    admittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    thresholdHRHigh: 150, thresholdHRLow: 45,
    thresholdSpO2Low: 92, thresholdBPSysHigh: 170, thresholdBPSysLow: 85,
    thresholdTempHigh: 38.5, thresholdTempLow: 35.5,
    _count: { alerts: 3 },
    assignments: [
      { id: 'a9', role: 'PRIMARY_DOCTOR', staff: { name: 'Dr. James Wilson', department: 'Neurology' } },
    ],
    _baseline: { heartRate: 68, spO2: 98, systolicBP: 112, diastolicBP: 72, temperature: 36.6, respiratoryRate: 15 },
  },
  {
    id: 'pat-007', name: 'Michael Anderson', age: 78, gender: 'Male',
    bedNumber: 'CCU-202', ward: 'CCU', status: 'WARNING',
    diagnosis: 'Atrial Fibrillation',
    admittedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    thresholdHRHigh: 130, thresholdHRLow: 50,
    thresholdSpO2Low: 90, thresholdBPSysHigh: 160, thresholdBPSysLow: 85,
    thresholdTempHigh: 38.5, thresholdTempLow: 35.5,
    _count: { alerts: 20 },
    assignments: [
      { id: 'a10', role: 'PRIMARY_DOCTOR', staff: { name: 'Dr. Sarah Smith', department: 'Cardiology' } },
      { id: 'a11', role: 'NURSE', staff: { name: 'Nurse Michael Brown', department: 'CCU' } },
    ],
    _baseline: { heartRate: 85, spO2: 94, systolicBP: 138, diastolicBP: 86, temperature: 37.0, respiratoryRate: 19 },
  },
  {
    id: 'pat-008', name: 'Lisa Martinez', age: 29, gender: 'Female',
    bedNumber: 'W3-302', ward: 'Ward 3', status: 'STABLE',
    diagnosis: 'Asthma Exacerbation',
    admittedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    thresholdHRHigh: 150, thresholdHRLow: 45,
    thresholdSpO2Low: 92, thresholdBPSysHigh: 170, thresholdBPSysLow: 85,
    thresholdTempHigh: 38.5, thresholdTempLow: 35.5,
    _count: { alerts: 5 },
    assignments: [
      { id: 'a12', role: 'PRIMARY_DOCTOR', staff: { name: 'Dr. James Wilson', department: 'Pulmonology' } },
    ],
    _baseline: { heartRate: 76, spO2: 97, systolicBP: 115, diastolicBP: 73, temperature: 36.9, respiratoryRate: 18 },
  },
];

const EQUIP_TYPES = ['ECG', 'HEART_RATE_MONITOR', 'SPO2_SENSOR', 'BP_MONITOR', 'TEMP_SENSOR'];

export const demoEquipment = demoPatients.flatMap((patient, pi) =>
  EQUIP_TYPES.map((type, ti) => ({
    id: `equip-${pi * 5 + ti + 1}`,
    type,
    serialNumber: `SN-${type.slice(0, 3)}-${1000 + pi * 5 + ti}`,
    bedNumber: patient.bedNumber,
    status: Math.random() > 0.05 ? 'ONLINE' : 'OFFLINE',
    lastPingAt: new Date().toISOString(),
    patient: { name: patient.name },
  }))
);

export const demoStaff = [
  { id: 'staff-1', name: 'Dr. Sarah Smith', email: 'dr.smith@hospital.com', role: 'DOCTOR', department: 'Cardiology', assignedPatients: 4 },
  { id: 'staff-2', name: 'Dr. James Wilson', email: 'dr.wilson@hospital.com', role: 'DOCTOR', department: 'General Surgery', assignedPatients: 4 },
  { id: 'staff-3', name: 'Nurse Emily Davis', email: 'nurse.davis@hospital.com', role: 'NURSE', department: 'ICU', assignedPatients: 3 },
  { id: 'staff-4', name: 'Nurse Michael Brown', email: 'nurse.brown@hospital.com', role: 'NURSE', department: 'CCU', assignedPatients: 2 },
];
