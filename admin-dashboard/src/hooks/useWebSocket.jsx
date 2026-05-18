import { useState, useEffect, useCallback, useRef } from 'react';
import { WS_BASE } from '../utils/config.js';

const WS_URL = WS_BASE + '/ws';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastVitals, setLastVitals] = useState({});
  const [latestAlerts, setLatestAlerts] = useState([]);
  const [systemHealth, setSystemHealth] = useState(null);
  const [equipmentStatus, setEquipmentStatus] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeout = useRef(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('hpms_token');
    const url = token ? `${WS_URL}?token=${token}` : WS_URL;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('[WS] Connected');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        
        switch (msg.type) {
          case 'vitals':
            setLastVitals(prev => ({
              ...prev,
              [msg.data.patientId]: msg.data,
            }));
            break;
          case 'alerts':
            setLatestAlerts(prev => [msg.data, ...prev].slice(0, 50));
            break;
          case 'system-health':
            setSystemHealth(msg.data);
            break;
          case 'equipment-status':
            setEquipmentStatus(msg.data);
            break;
          case 'notification':
            setNotifications(prev => [msg.data, ...prev].slice(0, 20));
            break;
        }
      } catch (err) {
        // ignore
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('[WS] Disconnected, reconnecting...');
      reconnectTimeout.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
    };
  }, [connect]);

  return {
    isConnected,
    lastVitals,
    latestAlerts,
    systemHealth,
    equipmentStatus,
    notifications,
    clearAlerts: () => setLatestAlerts([]),
  };
}

export default useWebSocket;
