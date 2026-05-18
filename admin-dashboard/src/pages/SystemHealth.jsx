import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function SystemHealth({ systemHealth: wsSystemHealth }) {
  const [health, setHealth] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (wsSystemHealth) {
      setHealth(prev => prev ? { ...prev, ...wsSystemHealth } : wsSystemHealth);
    }
  }, [wsSystemHealth]);

  async function loadHealth() {
    try {
      const [h, c] = await Promise.all([
        api.getSystemHealth(),
        api.getSystemClients(),
      ]);
      setHealth(h);
      setClients(c);
    } catch (err) {
      console.error('Failed to load health:', err);
    }
    setLoading(false);
  }

  if (loading || !health) {
    return (
      <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  const parsePercent = (str) => parseFloat(str) || 0;

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">System Health</h1>
          <p className="page-description">Core processing tier status and server monitoring</p>
        </div>
        <span className={`status-badge ${health.status === 'HEALTHY' ? 'stable' : 'critical'}`} style={{ fontSize: '0.8rem' }}>
          {health.status === 'HEALTHY' ? '🟢' : '🔴'} {health.status}
        </span>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card teal">
          <div className="stat-icon">⏱️</div>
          <div className="stat-label">Server Uptime</div>
          <div className="stat-value" style={{ fontSize: '1.3rem' }}>{health.uptimeFormatted}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">📡</div>
          <div className="stat-label">Connected Clients</div>
          <div className="stat-value">{health.connectedClients}</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-icon">📊</div>
          <div className="stat-label">Processed Readings</div>
          <div className="stat-value">{health.services?.streamProcessor?.processedCount || 0}</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">🚨</div>
          <div className="stat-label">Alerts Triggered</div>
          <div className="stat-value">{health.services?.alertingEngine?.alertsTriggered || 0}</div>
        </div>
      </div>

      {/* Server Cards */}
      <div className="health-grid" style={{ marginTop: '16px' }}>
        {health.servers && Object.entries(health.servers).map(([key, server]) => (
          <div key={key} className="server-card">
            <div className="server-status">
              <span className={`online-dot ${server.status === 'ACTIVE' ? 'online' : 'offline'}`}
                    style={{ width: '12px', height: '12px' }}></span>
              <div>
                <div className="server-name">{key === 'primary' ? '🖥️ Primary Server (A)' : '🖥️ Backup Server (B)'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{server.status}</div>
              </div>
            </div>
            <div className="server-metrics">
              <div>
                <div className="metric-row">
                  <span className="metric-label">CPU Usage</span>
                  <span className="metric-value">{server.cpu}</span>
                </div>
                <div className="metric-bar">
                  <div className={`metric-bar-fill ${parsePercent(server.cpu) > 80 ? 'high' : parsePercent(server.cpu) > 50 ? 'medium' : 'low'}`}
                       style={{ width: server.cpu }}></div>
                </div>
              </div>
              <div>
                <div className="metric-row">
                  <span className="metric-label">Memory Usage</span>
                  <span className="metric-value">{server.memory}</span>
                </div>
                <div className="metric-bar">
                  <div className={`metric-bar-fill ${parsePercent(server.memory) > 80 ? 'high' : parsePercent(server.memory) > 50 ? 'medium' : 'low'}`}
                       style={{ width: server.memory }}></div>
                </div>
              </div>
              <div className="metric-row">
                <span className="metric-label">Uptime</span>
                <span className="metric-value">{server.uptime}s</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Database Replication */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <div className="card-title">🗄️ Database Replication</div>
        </div>
        {health.database && (
          <div className="grid-2">
            {Object.entries(health.database).map(([key, db]) => (
              <div key={key} style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className={`online-dot ${db.status === 'ACTIVE' || db.status === 'SYNCED' ? 'online' : 'error'}`}></span>
                  <span style={{ fontWeight: 600 }}>{key === 'primary' ? 'Primary DB (Active)' : 'Backup DB (Standby)'}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Status: <span style={{ color: 'var(--status-stable)' }}>{db.status}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Replication Lag: <span style={{ color: 'var(--text-primary)' }}>{db.replicationLag}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Services Status */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <div className="card-title">⚡ Service Status</div>
        </div>
        <div className="grid-3">
          {health.services && Object.entries(health.services).map(([key, service]) => (
            <div key={key} style={{ padding: '16px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span className={`online-dot ${service.status === 'RUNNING' ? 'online' : 'error'}`}></span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                  {key === 'streamProcessor' ? '📡 Stream Processor' :
                   key === 'alertingEngine' ? '🚨 Alerting Engine' :
                   '📱 Notification Gateway'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Status: <span style={{ color: 'var(--status-stable)' }}>{service.status}</span>
              </div>
              {service.processedCount !== undefined && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Processed: <span style={{ color: 'var(--text-primary)' }}>{service.processedCount}</span>
                </div>
              )}
              {service.alertsTriggered !== undefined && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Alerts: <span style={{ color: 'var(--text-primary)' }}>{service.alertsTriggered}</span>
                </div>
              )}
              {service.sentCount !== undefined && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Sent: <span style={{ color: 'var(--text-primary)' }}>{service.sentCount}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Connected Clients */}
      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <div className="card-title">👥 Connected Clients</div>
        </div>
        {clients.length === 0 ? (
          <div className="empty-state" style={{ padding: '20px' }}>
            <p>No clients connected</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Client ID</th>
                <th>User</th>
                <th>Role</th>
                <th>Subscriptions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{client.id.slice(0, 20)}...</td>
                  <td>{client.user.name}</td>
                  <td><span className="status-badge stable">{client.user.role}</span></td>
                  <td style={{ fontSize: '0.75rem' }}>{client.subscriptions.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
