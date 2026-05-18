import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LiveChart from '../components/LiveChart';

export default function Dashboard({ lastVitals, latestAlerts }) {
  const [patients, setPatients] = useState([]);
  const [alertSummary, setAlertSummary] = useState({});
  const [equipStatus, setEquipStatus] = useState({});
  const [vitalHistory, setVitalHistory] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Accumulate vital history for charts
  useEffect(() => {
    Object.entries(lastVitals).forEach(([patientId, data]) => {
      setVitalHistory(prev => {
        const existing = prev[patientId] || [];
        const updated = [...existing, data].slice(-30);
        return { ...prev, [patientId]: updated };
      });
    });
  }, [lastVitals]);

  async function loadData() {
    try {
      const [p, a, e] = await Promise.all([
        api.getPatients(),
        api.getAlertsSummary(),
        api.getEquipmentStatus(),
      ]);
      setPatients(p);
      setAlertSummary(a);
      setEquipStatus(e);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }

  const criticalPatients = patients.filter(p => p.status === 'CRITICAL').length;
  const warningPatients = patients.filter(p => p.status === 'WARNING').length;
  const stablePatients = patients.filter(p => p.status === 'STABLE').length;

  const getVitalStatus = (type, value, patient) => {
    if (!value) return 'normal';
    switch (type) {
      case 'heartRate':
        return value > (patient?.thresholdHRHigh || 180) || value < (patient?.thresholdHRLow || 40) ? 'critical' :
               value > 120 || value < 50 ? 'warning' : 'normal';
      case 'spO2':
        return value < (patient?.thresholdSpO2Low || 85) ? 'critical' :
               value < 92 ? 'warning' : 'normal';
      case 'systolicBP':
        return value > (patient?.thresholdBPSysHigh || 200) || value < (patient?.thresholdBPSysLow || 70) ? 'critical' :
               value > 150 || value < 90 ? 'warning' : 'normal';
      case 'temperature':
        return value > (patient?.thresholdTempHigh || 40) || value < (patient?.thresholdTempLow || 34) ? 'critical' :
               value > 38 || value < 35.5 ? 'warning' : 'normal';
      default:
        return 'normal';
    }
  };

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Real-Time Dashboard</h1>
          <p className="page-description">Live monitoring of all patients and system status</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card teal">
          <div className="stat-icon">👥</div>
          <div className="stat-label">Total Patients</div>
          <div className="stat-value">{patients.length}</div>
          <div className="stat-change neutral">Active monitoring</div>
        </div>
        <div className="stat-card critical">
          <div className="stat-icon">🚨</div>
          <div className="stat-label">Critical</div>
          <div className="stat-value">{criticalPatients}</div>
          <div className="stat-change up">Requires immediate attention</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-label">Warnings</div>
          <div className="stat-value">{warningPatients}</div>
          <div className="stat-change neutral">{alertSummary.warning || 0} active alerts</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">🔧</div>
          <div className="stat-label">Equipment Online</div>
          <div className="stat-value">{equipStatus.healthPercentage || 0}%</div>
          <div className="stat-change neutral">{equipStatus.online || 0}/{equipStatus.total || 0} devices</div>
        </div>
      </div>

      {/* Recent Alerts Banner */}
      {latestAlerts.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div className="card-title" style={{ marginBottom: '12px' }}>🔔 Recent Alerts</div>
          <div className="alerts-list">
            {latestAlerts.slice(0, 3).map((alert, i) => (
              <div key={alert.id || i} className={`alert-item ${alert.severity?.toLowerCase()}`}>
                <span className="alert-icon">
                  {alert.severity === 'CRITICAL' ? '🔴' : '🟡'}
                </span>
                <div className="alert-content">
                  <div className="alert-message">{alert.message}</div>
                  <div className="alert-meta">
                    {alert.patientName} • Bed {alert.bedNumber}
                  </div>
                </div>
                <span className="alert-time">
                  {new Date(alert.createdAt).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Patient Cards Grid */}
      <div className="card-title" style={{ marginBottom: '16px' }}>📋 Patient Overview</div>
      <div className="patients-grid">
        {patients.map(patient => {
          const vitals = lastVitals[patient.id];
          const history = vitalHistory[patient.id] || [];
          const hrData = history.map(v => v.heartRate).filter(Boolean);

          return (
            <div
              key={patient.id}
              className={`patient-card ${patient.status?.toLowerCase()}`}
              onClick={() => navigate(`/patients/${patient.id}`)}
              id={`patient-card-${patient.bedNumber}`}
            >
              <div className="patient-header">
                <div>
                  <div className="patient-name">{patient.name}</div>
                  <div className="patient-meta">
                    Bed {patient.bedNumber} • {patient.ward} • {patient.age}y {patient.gender}
                  </div>
                  <div className="patient-meta" style={{ fontSize: '0.7rem', marginTop: '2px' }}>
                    {patient.diagnosis}
                  </div>
                </div>
                <span className={`status-badge ${patient.status?.toLowerCase()}`}>
                  {patient.status}
                </span>
              </div>

              {vitals ? (
                <div className="patient-vitals-grid">
                  <div className={`vital-mini ${getVitalStatus('heartRate', vitals.heartRate, patient)}`}>
                    <div className="vital-label">HR</div>
                    <div className="vital-value">
                      {vitals.heartRate}
                      <span className="vital-unit"> bpm</span>
                    </div>
                  </div>
                  <div className={`vital-mini ${getVitalStatus('spO2', vitals.spO2, patient)}`}>
                    <div className="vital-label">SpO2</div>
                    <div className="vital-value">
                      {vitals.spO2}
                      <span className="vital-unit">%</span>
                    </div>
                  </div>
                  <div className={`vital-mini ${getVitalStatus('systolicBP', vitals.systolicBP, patient)}`}>
                    <div className="vital-label">BP</div>
                    <div className="vital-value">
                      {vitals.systolicBP}/{vitals.diastolicBP}
                    </div>
                  </div>
                  <div className={`vital-mini ${getVitalStatus('temperature', vitals.temperature, patient)}`}>
                    <div className="vital-label">Temp</div>
                    <div className="vital-value">
                      {vitals.temperature}
                      <span className="vital-unit">°C</span>
                    </div>
                  </div>
                  <div className="vital-mini normal">
                    <div className="vital-label">RR</div>
                    <div className="vital-value">
                      {vitals.respiratoryRate}
                      <span className="vital-unit">/min</span>
                    </div>
                  </div>
                  <div className="vital-mini normal">
                    <div className="vital-label">Alerts</div>
                    <div className="vital-value" style={{ color: patient._count?.alerts > 0 ? 'var(--status-critical)' : 'var(--status-stable)' }}>
                      {patient._count?.alerts || 0}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 8px' }}></div>
                  Waiting for data...
                </div>
              )}

              {hrData.length > 5 && (
                <div style={{ marginTop: '12px', height: '60px', opacity: 0.7 }}>
                  <LiveChart
                    data={hrData}
                    label="HR"
                    color="#00d4aa"
                    unit="bpm"
                    maxPoints={20}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
