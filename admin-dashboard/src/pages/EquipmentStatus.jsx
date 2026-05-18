import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function EquipmentStatus({ equipmentStatus }) {
  const [equipment, setEquipment] = useState([]);
  const [statusSummary, setStatusSummary] = useState({});
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEquipment();
    const interval = setInterval(loadEquipment, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (equipmentStatus && equipmentStatus.length > 0) {
      setEquipment(equipmentStatus);
    }
  }, [equipmentStatus]);

  async function loadEquipment() {
    try {
      const [e, s] = await Promise.all([
        api.getEquipment(),
        api.getEquipmentStatus(),
      ]);
      setEquipment(e);
      setStatusSummary(s);
    } catch (err) {
      console.error('Failed to load equipment:', err);
    }
    setLoading(false);
  }

  const filteredEquipment = filter === 'all'
    ? equipment
    : equipment.filter(e => e.status === filter.toUpperCase());

  const typeIcons = {
    ECG: '📈',
    HEART_RATE_MONITOR: '❤️',
    SPO2_SENSOR: '🫁',
    BP_MONITOR: '🩸',
    TEMP_SENSOR: '🌡️',
  };

  return (
    <div className="page-content fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Equipment Status</h1>
          <p className="page-description">Monitor all connected medical devices across wards</p>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="stat-card teal">
          <div className="stat-label">Total Devices</div>
          <div className="stat-value">{statusSummary.total || 0}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--status-online)' }}>
          <div className="stat-label">Online</div>
          <div className="stat-value" style={{ color: 'var(--status-online)' }}>{statusSummary.online || 0}</div>
        </div>
        <div className="stat-card" style={{ borderTop: '3px solid var(--status-offline)' }}>
          <div className="stat-label">Offline</div>
          <div className="stat-value" style={{ color: 'var(--status-offline)' }}>{statusSummary.offline || 0}</div>
        </div>
        <div className="stat-card critical">
          <div className="stat-label">Error</div>
          <div className="stat-value">{statusSummary.error || 0}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-label">Health</div>
          <div className="stat-value">{statusSummary.healthPercentage || 0}%</div>
        </div>
      </div>

      <div className="filter-bar">
        {['all', 'online', 'offline', 'error', 'maintenance'].map(f => (
          <button
            key={f}
            className={`filter-chip ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'online' && '🟢 '}{f === 'offline' && '⚫ '}{f === 'error' && '🔴 '}
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
        </div>
      ) : (
        <div className="equipment-grid">
          {filteredEquipment.map(equip => (
            <div key={equip.id} className="equipment-card" id={`equip-${equip.id}`}>
              <div className="equip-header">
                <div>
                  <div className="equip-name">
                    {typeIcons[equip.type] || '🔧'} {equip.type.replace(/_/g, ' ')}
                  </div>
                  <div className="equip-type">{equip.serialNumber}</div>
                </div>
                <span className={`online-dot ${equip.status?.toLowerCase()}`}></span>
              </div>
              <div className="equip-bed">
                📍 Bed {equip.bedNumber}
                {equip.patient && ` • ${equip.patient.name}`}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Last ping: {new Date(equip.lastPingAt).toLocaleTimeString()}
              </div>
              <div style={{ marginTop: '8px' }}>
                <span className={`status-badge ${equip.status === 'ONLINE' ? 'stable' : equip.status === 'ERROR' ? 'critical' : 'warning'}`}>
                  {equip.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
