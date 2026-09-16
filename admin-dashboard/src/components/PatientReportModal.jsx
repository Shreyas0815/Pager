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
══════════════════════════════════════════════════════════
  HOSPITAL PATIENT MONITORING SYSTEM — CLINICAL SUMMARY
══════════════════════════════════════════════════════════
Patient: ${patient.name || patientName || 'Unknown'} (Bed: ${patient.bedNumber || '--'}, Ward: ${patient.ward || '--'})
Demographics: ${patient.age || '--'}y ${patient.gender || ''} | Admission: ${patient.admissionDate ? new Date(patient.admissionDate).toLocaleDateString() : 'Active'}
Diagnosis: ${patient.diagnosis || 'General Observation'}
Clinical Status: ${patient.status || clinical.severity || 'STABLE'}
Report Generated: ${new Date(report?.generatedAt || Date.now()).toLocaleString()}

[PHYSICIAN ASSESSMENT & CLINICAL SYNTHESIS]
${clinical.narrative || 'Patient is actively monitored under telemetry protocol.'}

[KEY TELEMETRY FINDINGS]
${(clinical.keyFindings || []).map(f => `• ${f}`).join('\n') || '• All tracked vital signs within baseline bounds.'}

[VITAL SIGNS TELEMETRY (1-HOUR SUMMARY)]
• Heart Rate:      ${vitals.heartRate ?? '--'} BPM (1h Avg: ${stats.heartRate?.avg ?? '--'}, Range: ${stats.heartRate?.min ?? '--'} - ${stats.heartRate?.max ?? '--'})
• SpO2 Oxygen:     ${vitals.spO2 ?? '--'}% (1h Avg: ${stats.spO2?.avg ?? '--'}, Range: ${stats.spO2?.min ?? '--'} - ${stats.spO2?.max ?? '--'})
• Blood Pressure:  ${vitals.systolicBP ?? '--'}/${vitals.diastolicBP ?? '--'} mmHg
• Body Temp:       ${vitals.temperature ?? '--'} °C (1h Avg: ${stats.temperature?.avg ?? '--'})
• Resp Rate:       ${vitals.respiratoryRate ?? '--'} /min

[CARE PLAN & RECOMMENDATIONS]
${(clinical.recommendations || []).map(r => `• ${r}`).join('\n') || '• Continue regular telemetry monitoring.'}

[ALERTS INCIDENT LOG (24H)]
Total: ${alerts.total || 0} | Critical: ${alerts.critical || 0} | Warning: ${alerts.warning || 0} | Acknowledged: ${alerts.acknowledged || 0}
══════════════════════════════════════════════════════════
`.trim();

    navigator.clipboard.writeText(summaryText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      console.error('Failed to copy summary:', err);
    });
  };

  const handlePrint = () => {
    // Generate clean isolated iframe document for flawless, 0-blank-page PDF export
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    const patName = patient.name || patientName || 'Patient';
    const bed = patient.bedNumber || 'ICU';
    const reportDate = new Date(report?.generatedAt || Date.now()).toLocaleString();
    const severity = patient.status || clinical.severity || 'STABLE';
    const isCrit = severity === 'CRITICAL';
    const isWarn = severity === 'WARNING';
    const statusColor = isCrit ? '#dc2626' : isWarn ? '#d97706' : '#059669';
    const statusBg = isCrit ? '#fef2f2' : isWarn ? '#fffbeb' : '#ecfdf5';

    const vitalsList = [
      { name: 'Heart Rate', val: vitals.heartRate, unit: 'BPM', stat: stats.heartRate, target: '60 - 100' },
      { name: 'SpO2 Oxygen', val: vitals.spO2, unit: '%', stat: stats.spO2, target: '95 - 100' },
      { name: 'Systolic BP', val: vitals.systolicBP, unit: 'mmHg', stat: stats.systolicBP, target: '90 - 120' },
      { name: 'Diastolic BP', val: vitals.diastolicBP, unit: 'mmHg', stat: stats.diastolicBP, target: '60 - 80' },
      { name: 'Temperature', val: vitals.temperature, unit: '°C', stat: stats.temperature, target: '36.1 - 37.2' },
      { name: 'Resp Rate', val: vitals.respiratoryRate, unit: '/min', stat: stats.respiratoryRate, target: '12 - 20' },
    ];

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>HPMS_Report_${patName.replace(/\s+/g, '_')}_Bed_${bed}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 10mm 12mm;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #0f172a;
              background: #ffffff;
              font-size: 9.5pt;
              line-height: 1.4;
              padding: 0;
            }
            .header-bar {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 8px;
              margin-bottom: 12px;
            }
            .hospital-title {
              font-size: 15pt;
              font-weight: 800;
              color: #1e40af;
              letter-spacing: -0.02em;
            }
            .hospital-sub {
              font-size: 8pt;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #64748b;
            }
            .header-meta {
              text-align: right;
              font-size: 8pt;
              color: #475569;
            }
            .status-tag {
              display: inline-block;
              font-size: 8.5pt;
              font-weight: 700;
              color: ${statusColor};
              background: ${statusBg};
              border: 1px solid ${statusColor};
              padding: 3px 10px;
              border-radius: 12px;
              margin-top: 4px;
            }
            .patient-box {
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 6px;
              padding: 8px 12px;
              margin-bottom: 12px;
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 8px 12px;
            }
            .pat-field {
              font-size: 8pt;
            }
            .pat-label {
              color: #64748b;
              text-transform: uppercase;
              font-size: 7pt;
              font-weight: 700;
              display: block;
            }
            .pat-val {
              font-weight: 700;
              color: #0f172a;
              font-size: 9pt;
            }
            .section-title {
              font-size: 9.5pt;
              font-weight: 800;
              color: #1e40af;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
              margin: 10px 0 6px 0;
              text-transform: uppercase;
              letter-spacing: 0.04em;
            }
            .assessment-card {
              border-left: 4px solid ${statusColor};
              background: #f8fafc;
              border-top: 1px solid #e2e8f0;
              border-right: 1px solid #e2e8f0;
              border-bottom: 1px solid #e2e8f0;
              border-radius: 4px;
              padding: 8px 12px;
              margin-bottom: 10px;
            }
            .assessment-narrative {
              font-size: 9pt;
              line-height: 1.45;
              color: #1e293b;
              margin-bottom: 8px;
            }
            .bullet-list {
              padding-left: 16px;
              font-size: 8.5pt;
              color: #334155;
            }
            .bullet-list li {
              margin-bottom: 3px;
            }
            table.vitals-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
              font-size: 8.5pt;
            }
            table.vitals-table th {
              background: #f1f5f9;
              border: 1px solid #cbd5e1;
              padding: 5px 8px;
              text-align: left;
              font-weight: 700;
              color: #334155;
              text-transform: uppercase;
              font-size: 7pt;
            }
            table.vitals-table td {
              border: 1px solid #cbd5e1;
              padding: 5px 8px;
              color: #0f172a;
            }
            .current-val {
              font-weight: 800;
              color: #1e40af;
            }
            .grid-cols-2 {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 12px;
              margin-bottom: 10px;
            }
            .mini-box {
              border: 1px solid #cbd5e1;
              border-radius: 4px;
              padding: 8px;
              background: #f8fafc;
              font-size: 8pt;
            }
            .mini-box-title {
              font-weight: 700;
              color: #334155;
              text-transform: uppercase;
              font-size: 7.5pt;
              margin-bottom: 6px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 3px;
            }
            .alert-item {
              padding: 3px 0;
              border-bottom: 1px dotted #cbd5e1;
              font-size: 8pt;
            }
            .sign-off-section {
              margin-top: 14px;
              padding-top: 10px;
              border-top: 1px solid #cbd5e1;
              display: flex;
              justify-content: space-between;
              font-size: 8pt;
              color: #475569;
            }
            .footer-disclaimer {
              margin-top: 10px;
              font-size: 6.5pt;
              color: #94a3b8;
              text-align: center;
              border-top: 1px solid #e2e8f0;
              padding-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="header-bar">
            <div>
              <div class="hospital-title">🏥 Hospital Patient Monitoring System</div>
              <div class="hospital-sub">Official Clinical Telemetry & Patient Summary Report</div>
            </div>
            <div class="header-meta">
              <div><strong>Generated:</strong> ${reportDate}</div>
              <div><strong>Record ID:</strong> HPMS-${patient.id ? patient.id.slice(0, 8).toUpperCase() : 'REC-01'}</div>
              <div><span class="status-tag">${severity} CONDITION</span></div>
            </div>
          </div>

          <div class="patient-box">
            <div class="pat-field">
              <span class="pat-label">Patient Name</span>
              <span class="pat-val">${patName}</span>
            </div>
            <div class="pat-field">
              <span class="pat-label">Bed & Ward</span>
              <span class="pat-val">Bed ${bed} • ${patient.ward || 'General'}</span>
            </div>
            <div class="pat-field">
              <span class="pat-label">Age / Gender</span>
              <span class="pat-val">${patient.age || '--'}y ${patient.gender || ''}</span>
            </div>
            <div class="pat-field">
              <span class="pat-label">Primary Diagnosis</span>
              <span class="pat-val">${patient.diagnosis || 'Observation'}</span>
            </div>
          </div>

          <div class="section-title">Physician Assessment & Synthesis</div>
          <div class="assessment-card">
            <div class="assessment-narrative">
              ${clinical.narrative || 'Patient vitals and clinical telemetry are actively tracked under standard hospital care protocol.'}
            </div>
            ${(clinical.keyFindings || []).length > 0 ? `
              <div style="font-weight:700;font-size:8pt;color:#475569;margin-bottom:3px;text-transform:uppercase;">Key Telemetry Findings:</div>
              <ul class="bullet-list">
                ${clinical.keyFindings.map(k => `<li>${k}</li>`).join('')}
              </ul>
            ` : ''}
            ${(clinical.recommendations || []).length > 0 ? `
              <div style="font-weight:700;font-size:8pt;color:#475569;margin-top:6px;margin-bottom:3px;text-transform:uppercase;">Care Plan & Interventions:</div>
              <ul class="bullet-list">
                ${clinical.recommendations.map(r => `<li><strong>Action:</strong> ${r}</li>`).join('')}
              </ul>
            ` : ''}
          </div>

          <div class="section-title">Vitals Telemetry & 1-Hour Statistical Analysis</div>
          <table class="vitals-table">
            <thead>
              <tr>
                <th>Vital Parameter</th>
                <th>Current Reading</th>
                <th>1-Hour Average</th>
                <th>1-Hour Min</th>
                <th>1-Hour Max</th>
                <th>Target Reference</th>
              </tr>
            </thead>
            <tbody>
              ${vitalsList.map(item => `
                <tr>
                  <td><strong>${item.name}</strong></td>
                  <td class="current-val">${item.val ?? item.stat?.latest ?? '--'} ${item.unit}</td>
                  <td>${item.stat?.avg ?? '--'} ${item.unit}</td>
                  <td>${item.stat?.min ?? '--'} ${item.unit}</td>
                  <td>${item.stat?.max ?? '--'} ${item.unit}</td>
                  <td>${item.target} ${item.unit}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="grid-cols-2">
            <div class="mini-box">
              <div class="mini-box-title">🚨 Alert Incident History (Last 24 Hours)</div>
              <div><strong>Summary:</strong> ${alerts.total || 0} Total (${alerts.critical || 0} Critical, ${alerts.warning || 0} Warning, ${alerts.acknowledged || 0} Acknowledged)</div>
              <div style="margin-top:6px;">
                ${(alerts.recentAlerts || []).slice(0, 3).map(a => `
                  <div class="alert-item">
                    <span>${a.severity === 'CRITICAL' ? '🔴' : '🟡'}</span>
                    <strong>${a.severity}:</strong> ${a.message}
                    <span style="color:#64748b;font-size:7pt;">(${new Date(a.time).toLocaleTimeString()})</span>
                  </div>
                `).join('') || '<div style="color:#64748b;">No alerts recorded in the past 24 hours.</div>'}
              </div>
            </div>

            <div class="mini-box">
              <div class="mini-box-title">👨‍⚕️ Assigned Care Team</div>
              <div>
                ${(staff || []).map(s => `
                  <div style="padding:2px 0;">
                    <strong>${s.name}</strong> — ${(s.role || '').replace(/_/g, ' ')} (${s.department || 'Care'})
                  </div>
                `).join('') || '<div>Primary ICU Telemetry Attending Team</div>'}
              </div>
            </div>
          </div>

          <div class="sign-off-section">
            <div>
              <strong>Attending Clinician:</strong> ___________________________
            </div>
            <div>
              <strong>Signature & Date:</strong> ___________________________
            </div>
          </div>

          <div class="footer-disclaimer">
            CONFIDENTIAL MEDICAL RECORD • Generated automatically by Hospital Patient Monitoring System (HPMS) for clinical reference only.
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger print once styles are ready
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 2500);
    }, 300);
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
            <div className="modal-meta-bar">
              <span className="meta-pill">Bed <strong>{patient.bedNumber || '--'}</strong></span>
              <span className="meta-pill">Ward <strong>{patient.ward || '--'}</strong></span>
              <span className="meta-pill">Age <strong>{patient.age || '--'}y</strong> {patient.gender || ''}</span>
              <span className="meta-pill diagnosis">Diagnosis: <strong>{patient.diagnosis || 'Observation'}</strong></span>
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
              <div className="spinner" style={{ width: '48px', height: '48px', margin: '0 auto 16px auto' }}></div>
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
                    <div className="clinical-checklist">
                      {clinical.keyFindings.map((finding, i) => (
                        <div key={i} className="checklist-item">
                          <span className="checklist-icon">🔹</span>
                          <span>{finding}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {clinical.recommendations && clinical.recommendations.length > 0 && (
                  <div className="clinical-section" style={{ marginTop: '14px' }}>
                    <div className="clinical-section-label">Care Plan & Next Steps:</div>
                    <div className="clinical-checklist">
                      {clinical.recommendations.map((rec, i) => (
                        <div key={i} className="checklist-item recommendation">
                          <span className="checklist-icon">⚡</span>
                          <span><strong>Action:</strong> {rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Vitals Summary Grid - 6 Uniform Columns */}
              <div className="report-section-title">
                <span>📊 Vitals Telemetry & Period Statistics</span>
                <span className="section-subtext">1-Hour Historical Range</span>
              </div>

              <div className="report-vitals-grid">
                {[
                  { label: 'Heart Rate', key: 'heartRate', value: vitals.heartRate, unit: 'BPM', icon: '❤️', color: '#ff3b5c', normal: '60 - 100' },
                  { label: 'SpO2 Oxygen', key: 'spO2', value: vitals.spO2, unit: '%', icon: '🫁', color: '#3b82f6', normal: '95 - 100' },
                  { label: 'Systolic BP', key: 'systolicBP', value: vitals.systolicBP, unit: 'mmHg', icon: '🩸', color: '#8b5cf6', normal: '90 - 120' },
                  { label: 'Diastolic BP', key: 'diastolicBP', value: vitals.diastolicBP, unit: 'mmHg', icon: '🩸', color: '#a855f7', normal: '60 - 80' },
                  { label: 'Temperature', key: 'temperature', value: vitals.temperature, unit: '°C', icon: '🌡️', color: '#ffb020', normal: '36.1 - 37.2' },
                  { label: 'Resp Rate', key: 'respiratoryRate', value: vitals.respiratoryRate, unit: '/min', icon: '💨', color: '#00d4aa', normal: '12 - 20' },
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
                      <div className="report-vital-stats-grid">
                        <div className="vital-stat-row">
                          <span className="stat-name">Avg:</span>
                          <span className="stat-val">{stat.avg ?? '--'}</span>
                        </div>
                        <div className="vital-stat-row">
                          <span className="stat-name">Min:</span>
                          <span className="stat-val">{stat.min ?? '--'}</span>
                        </div>
                        <div className="vital-stat-row">
                          <span className="stat-name">Max:</span>
                          <span className="stat-val">{stat.max ?? '--'}</span>
                        </div>
                      </div>
                      <div className="report-vital-target">Target: {v.normal}</div>
                    </div>
                  );
                })}
              </div>

              {/* Trends & Direction */}
              {trends && Object.keys(trends).length > 0 && !trends.insufficient_data && (
                <div style={{ marginTop: '20px' }}>
                  <div className="report-section-title">
                    <span>📈 Physiological Drift (24h Trends)</span>
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
                    <span>🚨 Alert Incidents (24h)</span>
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
                ⚠️ CONFIDENTIAL MEDICAL RECORD — Hospital Patient Monitoring System (HPMS). Generated automatically by stream telemetry engine. Verify with bedside monitors before clinical orders.
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
              title="Copy formatted summary text for EHR charting"
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
