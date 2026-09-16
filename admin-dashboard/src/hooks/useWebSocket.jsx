import { useState, useEffect, useCallback, useRef } from 'react';
import { WS_BASE, isDemoMode } from '../utils/config.js';
import { demoOnVitals, demoOnAlert, demoStart, demoStop } from '../utils/demoEngine.js';

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
  const demoCleanup = useRef([]);

  // ─── DEMO MODE: Simulate WebSocket with demoEngine events ───
  useEffect(() => {
    if (!isDemoMode()) return;

    // Start the demo simulation engine
    demoStart();
    setIsConnected(true);

    // Listen for vitals
    const unsubVitals = demoOnVitals((vitals) => {
      setLastVitals(prev => ({
        ...prev,
        [vitals.patientId]: vitals,
      }));
    });

    // Listen for alerts
    const unsubAlerts = demoOnAlert((alert) => {
      setLatestAlerts(prev => [alert, ...prev].slice(0, 50));
      setNotifications(prev => [{
        id: alert.id,
        type: 'CRITICAL_ALERT',
        message: alert.message,
        read: false,
        createdAt: alert.createdAt,
      }, ...prev].slice(0, 20));
    });

    demoCleanup.current = [unsubVitals, unsubAlerts];

    return () => {
      demoStop();
      demoCleanup.current.forEach(fn => fn());
      demoCleanup.current = [];
    };
  }, []);

  // ─── REAL MODE: Actual WebSocket connection ─────────────────
  const connect = useCallback(() => {
    if (isDemoMode()) return;

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
          case 'patient-status':
            // Patient status updates are handled by the vitals data flow
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
    if (isDemoMode()) return;
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
