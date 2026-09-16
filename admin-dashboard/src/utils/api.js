import { API_BASE, isDemoMode } from './config.js';
import {
  demoLogin, demoGetPatients, demoGetPatient, demoGetPatientVitals,
  demoGetAlerts, demoGetAlertsSummary, demoAcknowledgeAlert,
  demoGetEquipment, demoGetEquipmentStatus, demoGenerateReport,
  demoGetSystemHealth, demoGetSystemClients, demoGetStaff, demoGetNotifications,
  demoUpdateProfile,
} from './demoEngine.js';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('hpms_token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('hpms_token', token);
    } else {
      localStorage.removeItem('hpms_token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('hpms_token');
  }

  async request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.setToken(null);
      localStorage.removeItem('hpms_user');
      window.location.reload();
      throw new Error('Session expired');
    }

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }

    return data;
  }

  get(path) { return this.request(path); }
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); }
  put(path, body) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); }
  delete(path) { return this.request(path, { method: 'DELETE' }); }

  // Auth
  async login(email, password) {
    if (isDemoMode()) {
      const data = demoLogin(email, password);
      this.setToken(data.token);
      localStorage.setItem('hpms_user', JSON.stringify(data.user));
      return data;
    }
    const data = await this.post('/api/auth/login', { email, password });
    this.setToken(data.token);
    localStorage.setItem('hpms_user', JSON.stringify(data.user));
    return data;
  }

  logout() {
    this.setToken(null);
    localStorage.removeItem('hpms_user');
  }

  getUser() {
    const userStr = localStorage.getItem('hpms_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  async getMe() {
    if (isDemoMode()) return Promise.resolve(this.getUser());
    const user = await this.get('/api/auth/me');
    localStorage.setItem('hpms_user', JSON.stringify(user));
    return user;
  }

  async updateProfile(profileData) {
    if (isDemoMode()) {
      const updated = demoUpdateProfile(profileData);
      localStorage.setItem('hpms_user', JSON.stringify(updated));
      return Promise.resolve(updated);
    }
    const updated = await this.put('/api/auth/profile', profileData);
    localStorage.setItem('hpms_user', JSON.stringify(updated));
    return updated;
  }

  // Patients
  getPatients(params) {
    if (isDemoMode()) return Promise.resolve(demoGetPatients());
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/api/patients${qs}`);
  }
  getPatient(id) {
    if (isDemoMode()) return Promise.resolve(demoGetPatient(id));
    return this.get(`/api/patients/${id}`);
  }
  getPatientVitals(id, params) {
    if (isDemoMode()) return Promise.resolve(demoGetPatientVitals(id));
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/api/patients/${id}/vitals${qs}`);
  }
  getPatientLiveVitals(id) {
    if (isDemoMode()) return Promise.resolve(demoGetPatientVitals(id).slice(-1)[0] || {});
    return this.get(`/api/patients/${id}/vitals/live`);
  }

  // Alerts
  getAlerts(params) {
    if (isDemoMode()) return Promise.resolve(demoGetAlerts(params));
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/api/alerts${qs}`);
  }
  getAlertsSummary() {
    if (isDemoMode()) return Promise.resolve(demoGetAlertsSummary());
    return this.get('/api/alerts/summary');
  }
  acknowledgeAlert(id) {
    if (isDemoMode()) return Promise.resolve(demoAcknowledgeAlert(id));
    return this.post(`/api/alerts/${id}/acknowledge`);
  }

  // Equipment
  getEquipment(params) {
    if (isDemoMode()) return Promise.resolve(demoGetEquipment());
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/api/equipment${qs}`);
  }
  getEquipmentStatus() {
    if (isDemoMode()) return Promise.resolve(demoGetEquipmentStatus());
    return this.get('/api/equipment/status');
  }

  // Reports
  generateReport(patientId, type) {
    if (isDemoMode()) return Promise.resolve(demoGenerateReport(patientId));
    return this.post(`/api/reports/generate/${patientId}`, { type });
  }
  getReports(params) {
    if (isDemoMode()) return Promise.resolve([]);
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/api/reports${qs}`);
  }

  // System
  getSystemHealth() {
    if (isDemoMode()) return Promise.resolve(demoGetSystemHealth());
    return this.get('/api/system/health');
  }
  getSystemClients() {
    if (isDemoMode()) return Promise.resolve(demoGetSystemClients());
    return this.get('/api/system/clients');
  }

  // Staff
  getStaff(params) {
    if (isDemoMode()) return Promise.resolve(demoGetStaff());
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/api/staff${qs}`);
  }
  getNotifications() {
    if (isDemoMode()) return Promise.resolve(demoGetNotifications());
    return this.get('/api/staff/notifications');
  }
}

const api = new ApiClient();
export default api;
