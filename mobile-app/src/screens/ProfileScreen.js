import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { COLORS } from '../utils/constants';
import api from '../services/api';

export default function ProfileScreen({ onLogout }) {
  const [user, setUser] = useState(null);
  const [health, setHealth] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const u = await api.getUser();
    setUser(u);
    try {
      const h = await api.getSystemHealth();
      setHealth(h);
    } catch (err) {}
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      {/* Profile Card */}
      <View style={s.profileCard}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
          </Text>
        </View>
        <Text style={s.name}>{user?.name || 'Loading...'}</Text>
        <Text style={s.role}>{user?.role} • {user?.department}</Text>
        <Text style={s.email}>{user?.email}</Text>
      </View>

      {/* System Status */}
      {health && (
        <View style={s.card}>
          <Text style={s.cardTitle}>⚙️ System Status</Text>
          <Row label="Server Status" value={health.status} color={COLORS.accent} />
          <Row label="Uptime" value={health.uptimeFormatted} />
          <Row label="Connected Clients" value={health.connectedClients} />
          <Row label="Primary Server" value={health.servers?.primary?.status} color={COLORS.accent} />
          <Row label="Backup Server" value={health.servers?.backup?.status} />
          <Row label="DB Primary" value={health.database?.primary?.status} color={COLORS.accent} />
          <Row label="DB Replication" value={health.database?.backup?.replicationLag} />
        </View>
      )}

      {/* Services */}
      {health?.services && (
        <View style={s.card}>
          <Text style={s.cardTitle}>⚡ Services</Text>
          <Row label="Stream Processor" value={health.services.streamProcessor?.status} color={COLORS.accent} />
          <Row label="Processed Readings" value={health.services.streamProcessor?.processedCount} />
          <Row label="Alerting Engine" value={health.services.alertingEngine?.status} color={COLORS.accent} />
          <Row label="Alerts Triggered" value={health.services.alertingEngine?.alertsTriggered} />
          <Row label="Notifications Sent" value={health.services.notificationGateway?.sentCount} />
        </View>
      )}

      {/* Logout */}
      <TouchableOpacity style={s.logoutBtn} onPress={onLogout} activeOpacity={0.8}>
        <Text style={s.logoutText}>🚪 Sign Out</Text>
      </TouchableOpacity>

      <Text style={s.version}>HPMS Mobile v1.0.0</Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Row({ label, value, color }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={[s.rowValue, color && { color }]}>{value ?? '--'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 100 },
  profileCard: {
    backgroundColor: COLORS.cardLight, borderRadius: 16, padding: 24, alignItems: 'center',
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.borderLight, elevation: 2,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: COLORS.white },
  name: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  role: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  email: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  card: {
    backgroundColor: COLORS.cardLight, borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.borderLight,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 10, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowLabel: { fontSize: 13, color: COLORS.textMuted },
  rowValue: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  logoutBtn: {
    backgroundColor: 'rgba(255,59,92,0.08)', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 8, borderWidth: 1, borderColor: 'rgba(255,59,92,0.2)',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: COLORS.critical },
  version: { fontSize: 11, color: COLORS.textMuted, textAlign: 'center', marginTop: 20 },
});
