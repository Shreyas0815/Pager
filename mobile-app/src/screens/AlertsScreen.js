import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../utils/constants';
import api from '../services/api';
import wsService from '../services/websocket';

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({});

  useEffect(() => {
    loadAlerts();
    const unsub = wsService.on('alerts', (data) => {
      setAlerts(prev => [data, ...prev].slice(0, 50));
    });
    return unsub;
  }, []);

  async function loadAlerts() {
    try {
      const [a, s] = await Promise.all([
        api.getAlerts({ limit: '50' }),
        api.getAlertsSummary(),
      ]);
      setAlerts(a);
      setSummary(s);
    } catch (err) {
      console.log('Alerts error:', err.message);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  async function handleAck(alertId) {
    try {
      await api.acknowledgeAlert(alertId);
      setAlerts(prev => prev.map(a =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      ));
    } catch (err) {}
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
    >
      <View style={s.row}>
        <View style={[s.sc, { borderTopColor: COLORS.critical }]}>
          <Text style={[s.sv, { color: COLORS.critical }]}>{summary.critical || 0}</Text>
          <Text style={s.sl}>Critical</Text>
        </View>
        <View style={[s.sc, { borderTopColor: COLORS.warning }]}>
          <Text style={[s.sv, { color: COLORS.warning }]}>{summary.warning || 0}</Text>
          <Text style={s.sl}>Warning</Text>
        </View>
        <View style={[s.sc, { borderTopColor: COLORS.blue }]}>
          <Text style={[s.sv, { color: COLORS.blue }]}>{summary.unacknowledged || 0}</Text>
          <Text style={s.sl}>Pending</Text>
        </View>
      </View>

      {alerts.length === 0 ? (
        <View style={s.empty}>
          <Text style={{ fontSize: 36 }}>✅</Text>
          <Text style={s.emptyT}>No alerts</Text>
        </View>
      ) : (
        alerts.map(alert => (
          <View key={alert.id} style={[s.card, alert.severity === 'CRITICAL' ? s.crit : s.warn]}>
            <Text style={s.icon}>{alert.severity === 'CRITICAL' ? '🔴' : '🟡'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.msg}>{alert.message}</Text>
              <Text style={s.meta}>
                {alert.patient?.name} • Bed {alert.patient?.bedNumber}
              </Text>
              <Text style={s.time}>
                {new Date(alert.createdAt).toLocaleString()}
                {alert.acknowledged && ' • ✅ Acknowledged'}
              </Text>
            </View>
            {!alert.acknowledged && (
              <Text style={s.ack} onPress={() => handleAck(alert.id)}>ACK</Text>
            )}
          </View>
        ))
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 100 },
  row: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  sc: { flex: 1, backgroundColor: COLORS.cardLight, borderRadius: 12, padding: 14, alignItems: 'center', borderTopWidth: 3, elevation: 1 },
  sv: { fontSize: 24, fontWeight: '800' },
  sl: { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', marginTop: 4 },
  card: { backgroundColor: COLORS.cardLight, borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.borderLight, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  crit: { borderLeftWidth: 3, borderLeftColor: COLORS.critical },
  warn: { borderLeftWidth: 3, borderLeftColor: COLORS.warning },
  icon: { fontSize: 16, marginTop: 2 },
  msg: { fontSize: 13, fontWeight: '500', color: COLORS.primary, lineHeight: 19 },
  meta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 3 },
  time: { fontSize: 10, color: COLORS.textMuted, marginTop: 3 },
  ack: { fontSize: 11, fontWeight: '700', color: '#1e40af', backgroundColor: 'rgba(30,64,175,0.08)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyT: { fontSize: 16, fontWeight: '600', color: COLORS.primary, marginTop: 12 },
});
