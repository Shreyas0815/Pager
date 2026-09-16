import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LiveChart from '../components/LiveChart';
import PatientReportModal from '../components/PatientReportModal';

export default function PatientMonitor({ lastVitals }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [vitalHistory, setVitalHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [report, setReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (id) loadPatientData();
  }, [id]);

  // Collect streaming vitals
  useEffect(() => {
    if (id && lastVitals[id]) {
      setVitalHistory(prev => [...prev, lastVitals[id]].slice(-60));
    }
  }, [id, lastVitals]);

  async function loadPatientData() {
    setLoading(true);
    try {
      const [p, v, a] = await Promise.all([
        api.getPatient(id),
        api.getPatientVitals(id, { limit: '60' }),
        api.getAlerts({ patientId: id, limit: '20' }),
      ]);
      setPatient(p);
      setVitalHistory(v.map(vital => ({
        heartRate: vital.heartRate,
        spO2: vital.spO2,
        systolicBP: vital.systolicBP,
        diastolicBP: vital.diastolicBP,
        temperature: vital.temperature,
        respiratoryRate: vital.respiratoryRate,
        timestamp: vital.timestamp,
      })));
      setAlerts(a);
    } catch (err) {
      console.error('Failed to load patient:', err);
    }
    setLoading(false);
  }

  async function handleGenerateReport() {
    setGeneratingReport(true);
    setIsModalOpen(true);
    try {
      const r = await api.generateReport(id, 'COMPREHENSIVE');
      setReport(r.data || r);
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
    setGeneratingReport(false);
  }

  async function handleAcknowledge(alertId) {
    try {
      await api.acknowledgeAlert(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  }

  if (loading) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>Patient not found</h3>
          <button className="btn btn-primary" onClick={() => navigate('/patients')} style={{ marginTop: '16px' }}>
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  const currentVitals = lastVitals[id] || (vitalHistory.length > 0 ? vitalHistory[vitalHistory.length - 1] : {});
  const hrData = vitalHistory.map(v => v.heartRate).filter(Boolean);
  const spo2Data = vitalHistory.map(v => v.spO2).filter(Boolean);
  const bpSysData = vitalHistory.map(v => v.systolicBP).filter(Boolean);
  const bpDiaData = vitalHistory.map(v => v.diastolicBP).filter(Boolean);
  const tempData = vitalHistory.map(v => v.temperature).filter(Boolean);
  const rrData = vitalHistory.map(v => v.respiratoryRate).filter(Boolean);

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn btn-outline" onClick={() => navigate(-1)}>← Back</button>
            <div>
              <h1 className="page-title">{patient.name}</h1>
              <p className="page-description">
                Bed {patient.bedNumber} • {patient.ward} • {patient.age}y {patient.gender} • {patient.diagnosis}
              </p>
            </div>
            <span className={`status-badge ${patient.status?.toLowerCase()}`} style={{ fontSize: '0.75rem', padding: '5px 14px' }}>
              {patient.status}
            </span>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleGenerateReport}
          disabled={generatingReport}
          id="generate-report-btn"
        >
          {generatingReport ? '⏳ Generating...' : '📄 Generate Report'}
        </button>
      </div>

      {/* Current Vitals */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
        {[
          { label: 'Heart Rate', value: currentVitals.heartRate, unit: 'BPM', icon: '❤️', color: '#ff3b5c' },
          { label: 'SpO2', value: currentVitals.spO2, unit: '%', icon: '🫁', color: '#3b82f6' },
          { label: 'Systolic BP', value: currentVitals.systolicBP, unit: 'mmHg', icon: '🩸', color: '#8b5cf6' },
          { label: 'Diastolic BP', value: currentVitals.diastolicBP, unit: 'mmHg', icon: '🩸', color: '#a855f7' },
          { label: 'Temperature', value: currentVitals.temperature, unit: '°C', icon: '🌡️', color: '#ffb020' },
          { label: 'Resp Rate', value: currentVitals.respiratoryRate, unit: '/min', icon: '💨', color: '#00d4aa' },
        ].map((vital, i) => (
          <div key={i} className="stat-card" style={{ borderTop: `3px solid ${vital.color}` }}>
            <div className="stat-icon">{vital.icon}</div>
            <div className="stat-label">{vital.label}</div>
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>
              {vital.value ?? '--'}
            </div>
            <div className="stat-change neutral">{vital.unit}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2" style={{ marginTop: '16px' }}>
        <div className="chart-container">
          <div className="chart-title">❤️ Heart Rate</div>
          <LiveChart data={hrData} label="Heart Rate" color="#ff3b5c" unit="BPM" />
        </div>
        <div className="chart-container">
          <div className="chart-title">🫁 SpO2</div>
          <LiveChart data={spo2Data} label="SpO2" color="#3b82f6" unit="%" />
        </div>
        <div className="chart-container">
          <div className="chart-title">🩸 Blood Pressure</div>
          <LiveChart data={bpSysData} label="Systolic" color="#8b5cf6" unit="mmHg" />
        </div>
        <div className="chart-container">
          <div className="chart-title">🌡️ Temperature</div>
          <LiveChart data={tempData} label="Temp" color="#ffb020" unit="°C" />
        </div>
      </div>

      {/* Alerts & Staff Section */}
      <div className="grid-2-1" style={{ marginTop: '16px' }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">🚨 Alert History</div>
          </div>
          {alerts.length > 0 ? (
            <div className="alerts-list">
              {alerts.map(alert => (
                <div key={alert.id} className={`alert-item ${alert.severity?.toLowerCase()}`}>
                  <span className="alert-icon">
                    {alert.severity === 'CRITICAL' ? '🔴' : '🟡'}
                  </span>
                  <div className="alert-content">
                    <div className="alert-message">{alert.message}</div>
                    <div className="alert-meta">
                      {new Date(alert.createdAt).toLocaleString()}
                      {alert.acknowledged && ' • ✅ Acknowledged'}
                    </div>
                  </div>
                  {!alert.acknowledged && (
                    <button className="alert-ack-btn" onClick={() => handleAcknowledge(alert.id)}>
                      Acknowledge
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px' }}>
              <p>No alerts for this patient</p>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">👨‍⚕️ Assigned Staff</div>
          </div>
          {patient.assignments?.map(a => (
            <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.staff.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {a.role.replace('_', ' ')} • {a.staff.department}
              </div>
            </div>
          ))}
        </div>
      </div>



      {/* Patient Summary Report Modal */}
      <PatientReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportData={report}
        loading={generatingReport}
        patientName={patient?.name}
      />
    </div>
  );
}
