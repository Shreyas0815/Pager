import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function AlertsPanel({ latestAlerts }) {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    loadAlerts();
    const interval = setInterval(loadAlerts, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  async function loadAlerts() {
    try {
      const params = { limit: '100' };
      if (filter === 'critical') params.severity = 'CRITICAL';
      if (filter === 'warning') params.severity = 'WARNING';
      if (filter === 'unacknowledged') params.acknowledged = 'false';

      const [a, s] = await Promise.all([
        api.getAlerts(params),
        api.getAlertsSummary(),
      ]);
      setAlerts(a);
      setSummary(s);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
    setLoading(false);
  }

  async function handleAcknowledge(alertId) {
    try {
      await api.acknowledgeAlert(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  }

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alert Management</h1>
          <p className="page-description">Monitor and manage critical health alerts</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card teal">
          <div className="stat-label">Total Alerts</div>
          <div className="stat-value">{summary.total || 0}</div>
        </div>
        <div className="stat-card critical">
          <div className="stat-label">Critical Active</div>
          <div className="stat-value">{summary.critical || 0}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-label">Warning Active</div>
          <div className="stat-value">{summary.warning || 0}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Unacknowledged</div>
          <div className="stat-value">{summary.unacknowledged || 0}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-label">Last Hour</div>
          <div className="stat-value">{summary.recentCount || 0}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        {[
          { key: 'all', label: 'All Alerts' },
          { key: 'critical', label: '🔴 Critical' },
          { key: 'warning', label: '🟡 Warning' },
          { key: 'unacknowledged', label: 'Unacknowledged' },
        ].map(f => (
          <button
            key={f.key}
            className={`filter-chip ${filter === f.key ? 'active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No alerts found</h3>
          <p>All systems operating normally</p>
        </div>
      ) : (
        <div className="alerts-list">
          {alerts.map(alert => (
            <div key={alert.id} className={`alert-item ${alert.severity?.toLowerCase()}`} id={`alert-${alert.id}`}>
              <span className="alert-icon">
                {alert.severity === 'CRITICAL' ? '🔴' : '🟡'}
              </span>
              <div className="alert-content">
                <div className="alert-message">{alert.message}</div>
                <div className="alert-meta">
                  {alert.patient?.name} • Bed {alert.patient?.bedNumber} • {alert.patient?.ward}
                  {alert.acknowledged && (
                    <span style={{ color: 'var(--status-stable)' }}>
                      {' '}• ✅ Acknowledged by {alert.acknowledgedBy?.name}
                    </span>
                  )}
                </div>
              </div>
              <span className="alert-time">
                {new Date(alert.createdAt).toLocaleString()}
              </span>
              {!alert.acknowledged && (
                <button
                  className="alert-ack-btn"
                  onClick={() => handleAcknowledge(alert.id)}
                >
                  Acknowledge
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
