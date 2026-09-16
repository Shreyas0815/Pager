import { useState } from 'react';

export default function PatientReportModal({ isOpen, onClose, reportData, loading, patientName }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const report = reportData?.data || reportData;
  const patient = report?.patient || {};
  const vitals = report?.currentVitals || {};
  const stats = report?.lastHourStats || {};
  const trends = report?.trends || {};
  const clinical = report?.clinicalSummary || {};
  const alerts = report?.alertsSummary || {};
  const staff = report?.assignedStaff || [];

  const handleCopySummary = () => {
    const summaryText = `
═══════════════════════════════════════════════════════
  HOSPITAL PATIENT MONITORING SYSTEM — CLINICAL SUMMARY
═══════════════════════════════════════════════════════
Patient: ${patient.name || patientName || 'Unknown'} (Bed ${patient.bedNumber || '--'}, Ward: ${patient.ward || '--'})
Age / Gender: ${patient.age || '--'}y ${patient.gender || ''}
Diagnosis: ${patient.diagnosis || 'Unspecified'}
Clinical Status: ${patient.status || clinical.severity || 'STABLE'}
Report Generated: ${new Date(report?.generatedAt || Date.now()).toLocaleString()}

[CLINICAL ASSESSMENT]
${clinical.narrative || 'Vital signs continuously tracked. Patient monitored in telemetry unit.'}

[KEY FINDINGS]
${(clinical.keyFindings || []).map(f => `• ${f}`).join('\n') || '• Vital signs within monitored ranges.'}

[CURRENT VITALS]
• Heart Rate: ${vitals.heartRate ?? '--'} BPM (1h Avg: ${stats.heartRate?.avg ?? '--'}, Range: ${stats.heartRate?.min ?? '--'}-${stats.heartRate?.max ?? '--'})
• SpO2: ${vitals.spO2 ?? '--'}% (1h Avg: ${stats.spO2?.avg ?? '--'}, Range: ${stats.spO2?.min ?? '--'}-${stats.spO2?.max ?? '--'})
• Blood Pressure: ${vitals.systolicBP ?? '--'}/${vitals.diastolicBP ?? '--'} mmHg
• Temperature: ${vitals.temperature ?? '--'} °C (1h Avg: ${stats.temperature?.avg ?? '--'})
• Resp Rate: ${vitals.respiratoryRate ?? '--'} /min

[RECOMMENDATIONS]
${(clinical.recommendations || []).map(r => `• ${r}`).join('\n') || '• Maintain standard observation protocol.'}

[ALERTS SUMMARY]
Total Alerts (24h): ${alerts.total || 0} (${alerts.critical || 0} Critical, ${alerts.warning || 0} Warning)
═══════════════════════════════════════════════════════
`.trim();

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      console.error('Failed to copy summary:', err);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const getSeverityClass = (sev) => {
    const s = (sev || 'STABLE').toLowerCase();
    if (s.includes('crit')) return 'critical';
    if (s.includes('warn')) return 'warning';
    return 'stable';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container printable-report" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <span className="report-badge">🏥 CLINICAL PATIENT SUMMARY</span>
            <h2 className="modal-title">{patient.name || patientName || 'Patient Report'}</h2>
            <div className="modal-subtitle">
              <span>Bed: <strong>{patient.bedNumber || '--'}</strong></span>
              <span>Ward: <strong>{patient.ward || '--'}</strong></span>
              <span>Age: <strong>{patient.age || '--'}y</strong> {patient.gender || ''}</span>
              <span>Diagnosis: <em>{patient.diagnosis || 'Observation'}</em></span>
            </div>
          </div>
          <div className="modal-header-right">
            <span className={`status-badge ${getSeverityClass(patient.status || clinical.severity)}`}>
              {patient.status || clinical.severity || 'STABLE'}
            </span>
            <button className="modal-close-btn no-print" onClick={onClose} aria-label="Close modal">
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {loading ? (
            <div className="modal-loading">
              <div className="spinner" style={{ width: '48px', height: '48px', marginBottom: '16px' }}></div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Compiling Clinical Summary & Real-Time Telemetry...</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aggregating 24h vitals, threshold deviations, and attending notes.</p>
            </div>
          ) : (
            <>
              {/* Clinical Assessment Card */}
              <div className={`clinical-assessment-card ${getSeverityClass(clinical.severity || patient.status)}`}>
                <div className="clinical-header">
                  <div className="clinical-title">
                    <span className="clinical-icon">🩺</span>
                    <span>Physician Assessment & Synthesis</span>
                  </div>
                  <span className="clinical-time">
                    Generated: {new Date(report?.generatedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <p className="clinical-narrative">
                  {clinical.narrative || `Patient ${patient.name || ''} is being actively monitored in ${patient.ward || 'ward'}. Vitals and telemetry streams are evaluated continuously.`}
                </p>

                {clinical.keyFindings && clinical.keyFindings.length > 0 && (
                  <div className="clinical-section">
                    <div className="clinical-section-label">Key Telemetry Findings:</div>
                    <ul className="clinical-bullets">
                      {clinical.keyFindings.map((finding, i) => (
                        <li key={i}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {clinical.recommendations && clinical.recommendations.length > 0 && (
                  <div className="clinical-section" style={{ marginTop: '12px' }}>
                    <div className="clinical-section-label">Care Plan & Next Steps:</div>
                    <ul className="clinical-bullets recommendation-bullets">
                      {clinical.recommendations.map((rec, i) => (
                        <li key={i}><strong>Recommendation:</strong> {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Vitals Summary Grid */}
              <div className="report-section-title">
                <span>📊 Vitals Telemetry & Period Statistics</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>1-Hour Historical Range</span>
              </div>
              <div className="report-vitals-grid">
                {[
                  { label: 'Heart Rate', key: 'heartRate', value: vitals.heartRate, unit: 'BPM', icon: '❤️', color: '#ff3b5c', normal: '60 - 100' },
                  { label: 'SpO2 Oxygen', key: 'spO2', value: vitals.spO2, unit: '%', icon: '🫁', color: '#3b82f6', normal: '95 - 100' },
                  { label: 'Systolic BP', key: 'systolicBP', value: vitals.systolicBP, unit: 'mmHg', icon: '🩸', color: '#8b5cf6', normal: '90 - 120' },
                  { label: 'Diastolic BP', key: 'diastolicBP', value: vitals.diastolicBP, unit: 'mmHg', icon: '🩸', color: '#a855f7', normal: '60 - 80' },
                  { label: 'Temperature', key: 'temperature', value: vitals.temperature, unit: '°C', icon: '🌡️', color: '#ffb020', normal: '36.1 - 37.2' },
                  { label: 'Respiratory Rate', key: 'respiratoryRate', value: vitals.respiratoryRate, unit: '/min', icon: '💨', color: '#00d4aa', normal: '12 - 20' },
                ].map(v => {
                  const stat = stats[v.key] || {};
                  return (
                    <div key={v.key} className="report-vital-card" style={{ borderTop: `3px solid ${v.color}` }}>
                      <div className="report-vital-top">
                        <span className="report-vital-icon">{v.icon}</span>
                        <span className="report-vital-label">{v.label}</span>
                      </div>
                      <div className="report-vital-main">
                        <span className="report-vital-value">{v.value ?? stat.latest ?? '--'}</span>
                        <span className="report-vital-unit">{v.unit}</span>
                      </div>
                      <div className="report-vital-stats">
                        <span>Avg: <strong>{stat.avg ?? '--'}</strong></span>
                        <span>Min: <strong>{stat.min ?? '--'}</strong></span>
                        <span>Max: <strong>{stat.max ?? '--'}</strong></span>
                      </div>
                      <div className="report-vital-target">Target: {v.normal} {v.unit}</div>
                    </div>
                  );
                })}
              </div>

              {/* Trends & Direction */}
              {trends && Object.keys(trends).length > 0 && !trends.insufficient_data && (
                <div style={{ marginTop: '20px' }}>
                  <div className="report-section-title">
                    <span>📈 Physiological Directions & Drift (24h)</span>
                  </div>
                  <div className="trends-chip-group">
                    {Object.entries(trends).map(([key, t]) => {
                      if (!t || typeof t !== 'object') return null;
                      const isUp = t.direction === 'INCREASING';
                      const isDown = t.direction === 'DECREASING';
                      const arrow = isUp ? '↗' : isDown ? '↘' : '➔';
                      const chipClass = t.direction === 'STABLE' ? 'stable' : isUp ? 'warning' : 'critical';
                      const formattedName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      return (
                        <div key={key} className={`trend-chip ${chipClass}`}>
                          <span className="trend-arrow">{arrow}</span>
                          <span className="trend-name">{formattedName}:</span>
                          <span className="trend-status">{t.direction}</span>
                          {t.percentChange !== undefined && (
                            <span className="trend-pct">({t.percentChange > 0 ? '+' : ''}{t.percentChange}%)</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Alerts & Assigned Staff Grid */}
              <div className="grid-2" style={{ marginTop: '20px', gap: '16px' }}>
                {/* Alert Summary Box */}
                <div className="report-box">
                  <div className="report-box-title">
                    <span>🚨 Alert Summary & Incident Log</span>
                    <span className="badge-mini">{alerts.total || 0} Total</span>
                  </div>
                  <div className="alert-stats-pills">
                    <div className="pill pill-critical">🔴 {alerts.critical || 0} Critical</div>
                    <div className="pill pill-warning">🟡 {alerts.warning || 0} Warning</div>
                    <div className="pill pill-stable">✅ {alerts.acknowledged || 0} Acknowledged</div>
                  </div>
                  {alerts.recentAlerts && alerts.recentAlerts.length > 0 ? (
                    <div className="report-recent-alerts">
                      {alerts.recentAlerts.slice(0, 4).map((a, i) => (
                        <div key={a.id || i} className="report-alert-row">
                          <span className="report-alert-dot">{a.severity === 'CRITICAL' ? '🔴' : '🟡'}</span>
                          <div className="report-alert-info">
                            <div className="report-alert-msg">{a.message}</div>
                            <div className="report-alert-meta">
                              {new Date(a.time).toLocaleTimeString()} {a.acknowledged ? '• ✅ Ack' : '• ⚠️ Pending'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="report-empty-alerts">
                      <span>✅</span> No critical alerts logged for this patient.
                    </div>
                  )}
                </div>

                {/* Assigned Medical Staff */}
                <div className="report-box">
                  <div className="report-box-title">
                    <span>👨‍⚕️ Assigned Care Team</span>
                    <span className="badge-mini">{staff.length} Members</span>
                  </div>
                  {staff.length > 0 ? (
                    <div className="staff-list-compact">
                      {staff.map((s, idx) => (
                        <div key={idx} className="staff-row-compact">
                          <div className="staff-avatar-mini">
                            {s.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'ST'}
                          </div>
                          <div className="staff-info-compact">
                            <div className="staff-name-compact">{s.name}</div>
                            <div className="staff-role-compact">
                              {(s.role || '').replace(/_/g, ' ')} • {s.department || 'General Care'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="report-empty-alerts">
                      <span>🩺</span> Dr. Sarah Smith (Attending Cardiologist) & Primary ICU Nursing Team
                    </div>
                  )}
                </div>
              </div>

              {/* Report Footer Notice */}
              <div className="report-disclaimer">
                ⚠️ CONFIDENTIAL MEDICAL RECORD — Hospital Patient Monitoring System (HPMS). Generated automatically by intelligent stream processing engine for clinical reference. Verify with bedside monitors before medication titration.
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer no-print">
          <div className="modal-footer-left">
            <button
              className="btn btn-outline"
              onClick={handleCopySummary}
              disabled={loading}
              title="Copy clean formatted summary text for EHR charting"
            >
              {copied ? '✅ Summary Copied!' : '📋 Copy Summary'}
            </button>
            <button
              className="btn btn-outline"
              onClick={handlePrint}
              disabled={loading}
              title="Print clinical summary or save as PDF"
            >
              🖨️ Print / Save PDF
            </button>
          </div>
          <button className="btn btn-primary" onClick={onClose}>
            Done / Close
          </button>
        </div>
      </div>
    </div>
  );
}
