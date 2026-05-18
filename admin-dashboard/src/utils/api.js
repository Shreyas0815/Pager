import { API_BASE } from './config.js';

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

  // Patients
  getPatients(params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/api/patients${qs}`);
  }
  getPatient(id) { return this.get(`/api/patients/${id}`); }
  getPatientVitals(id, params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/api/patients/${id}/vitals${qs}`);
  }
  getPatientLiveVitals(id) { return this.get(`/api/patients/${id}/vitals/live`); }

  // Alerts
  getAlerts(params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/api/alerts${qs}`);
  }
  getAlertsSummary() { return this.get('/api/alerts/summary'); }
  acknowledgeAlert(id) { return this.post(`/api/alerts/${id}/acknowledge`); }

  // Equipment
  getEquipment(params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/api/equipment${qs}`);
  }
  getEquipmentStatus() { return this.get('/api/equipment/status'); }

  // Reports
  generateReport(patientId, type) { return this.post(`/api/reports/generate/${patientId}`, { type }); }
  getReports(params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/api/reports${qs}`);
  }

  // System
  getSystemHealth() { return this.get('/api/system/health'); }
  getSystemClients() { return this.get('/api/system/clients'); }

  // Staff
  getStaff(params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/api/staff${qs}`);
  }
  getNotifications() { return this.get('/api/staff/notifications'); }
}

const api = new ApiClient();
export default api;
