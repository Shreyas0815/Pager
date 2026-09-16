import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBase } from '../utils/constants';

class ApiService {
  constructor() {
    this.token = null;
  }

  async getToken() {
    if (!this.token) {
      try {
        this.token = await AsyncStorage.getItem('hpms_token');
      } catch (e) {}
    }
    return this.token;
  }

  async setToken(token) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('hpms_token', token);
    } else {
      await AsyncStorage.removeItem('hpms_token');
    }
  }

  async request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    const token = await this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${getApiBase()}${path}`, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Request failed');
    }
    return data;
  }

  get(path) { return this.request(path); }
  post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }); }
  put(path, body) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }); }

  async login(email, password) {
    const data = await this.post('/api/auth/login', { email, password });
    await this.setToken(data.token);
    await AsyncStorage.setItem('hpms_user', JSON.stringify(data.user));
    return data;
  }

  async logout() {
    await this.setToken(null);
    await AsyncStorage.removeItem('hpms_user');
  }

  async getUser() {
    const userStr = await AsyncStorage.getItem('hpms_user');
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

  // Reports
  generateReport(patientId, type) { return this.post(`/api/reports/generate/${patientId}`, { type }); }
  getReports(params) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.get(`/api/reports${qs}`);
  }

  // Notifications
  getNotifications() { return this.get('/api/staff/notifications'); }

  // System
  getSystemHealth() { return this.get('/api/system/health'); }
}

const api = new ApiService();
export default api;
