import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { COLORS, getStatusColor } from '../utils/constants';
import api from '../services/api';
import wsService from '../services/websocket';

export default function DashboardScreen({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [alertSummary, setAlertSummary] = useState({});
  const [user, setUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [liveVitals, setLiveVitals] = useState({});

  useEffect(() => {
    loadData();
    loadUser();

    const unsub = wsService.on('vitals', (data) => {
      setLiveVitals(prev => ({ ...prev, [data.patientId]: data }));
      if (data.patientStatus) {
        setPatients(prev => prev.map(p =>
          p.id === data.patientId && p.status !== data.patientStatus ? { ...p, status: data.patientStatus } : p
        ));
      }
    });

    // Listen for instant patient status changes (critical/warning)
    const unsubStatus = wsService.on('patient-status', (data) => {
      setPatients(prev => prev.map(p =>
        p.id === data.patientId ? { ...p, status: data.status } : p
      ));
    });

    return () => { unsub(); unsubStatus(); };
  }, []);

  async function loadUser() {
    const u = await api.getUser();
    setUser(u);
  }

  async function loadData() {
    try {
      const [p, a] = await Promise.all([
        api.getPatients(),
        api.getAlertsSummary(),
      ]);
      setPatients(p);
      setAlertSummary(a);
    } catch (err) {
      console.log('Dashboard load error:', err.message);
    }
    setLoading(false);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const criticalCount = patients.filter(p => p.status === 'CRITICAL').length;
  const warningCount = patients.filter(p => p.status === 'WARNING').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
      }
    >
      {/* Welcome */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome back,</Text>
        <Text style={styles.userName}>{user?.name || 'Doctor'}</Text>
        <Text style={styles.roleText}>{user?.role} • {user?.department}</Text>
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: COLORS.accent }]}>
          <Text style={styles.statIcon}>👥</Text>
          <Text style={styles.statValue}>{patients.length}</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.critical }]}>
          <Text style={styles.statIcon}>🚨</Text>
          <Text style={[styles.statValue, { color: COLORS.critical }]}>{criticalCount}</Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.warning }]}>
          <Text style={styles.statIcon}>⚠️</Text>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>{warningCount}</Text>
          <Text style={styles.statLabel}>Warning</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: COLORS.blue }]}>
          <Text style={styles.statIcon}>🔔</Text>
          <Text style={[styles.statValue, { color: COLORS.blue }]}>{alertSummary.unacknowledged || 0}</Text>
          <Text style={styles.statLabel}>Alerts</Text>
        </View>
      </View>

      {/* Critical Patients First */}
      {criticalCount > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚨 Critical Patients</Text>
          {patients.filter(p => p.status === 'CRITICAL').map(patient => {
            const vitals = liveVitals[patient.id];
            return (
              <TouchableOpacity
                key={patient.id}
                style={[styles.patientCard, styles.criticalCard]}
                onPress={() => navigation.navigate('PatientDetail', { patientId: patient.id })}
                activeOpacity={0.7}
              >
                <View style={styles.patientHeader}>
                  <View>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <Text style={styles.patientMeta}>
                      Bed {patient.bedNumber} • {patient.ward} • {patient.age}y
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: 'rgba(255,59,92,0.15)' }]}>
                    <Text style={[styles.statusText, { color: COLORS.critical }]}>CRITICAL</Text>
                  </View>
                </View>
                {vitals && (
                  <View style={styles.vitalsRow}>
                    <VitalMini label="HR" value={vitals.heartRate} unit="bpm" />
                    <VitalMini label="SpO2" value={vitals.spO2} unit="%" />
                    <VitalMini label="BP" value={`${vitals.systolicBP}/${vitals.diastolicBP}`} />
                    <VitalMini label="Temp" value={vitals.temperature} unit="°C" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* All Patients */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 All Patients</Text>
        {patients.map(patient => {
          const vitals = liveVitals[patient.id];
          return (
            <TouchableOpacity
              key={patient.id}
              style={styles.patientCard}
              onPress={() => navigation.navigate('PatientDetail', { patientId: patient.id })}
              activeOpacity={0.7}
            >
              <View style={styles.patientHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.patientName}>{patient.name}</Text>
                  <Text style={styles.patientMeta}>
                    Bed {patient.bedNumber} • {patient.ward} • {patient.diagnosis}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(patient.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(patient.status) }]}>
                    {patient.status}
                  </Text>
                </View>
              </View>
              {vitals && (
                <View style={styles.vitalsRow}>
                  <VitalMini label="HR" value={vitals.heartRate} unit="bpm" />
                  <VitalMini label="SpO2" value={vitals.spO2} unit="%" />
                  <VitalMini label="BP" value={`${vitals.systolicBP}/${vitals.diastolicBP}`} />
                  <VitalMini label="Temp" value={vitals.temperature} unit="°C" />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

function VitalMini({ label, value, unit }) {
  return (
    <View style={styles.vitalMini}>
      <Text style={styles.vitalLabel}>{label}</Text>
      <Text style={styles.vitalValue}>
        {value ?? '--'}
        {unit && <Text style={styles.vitalUnit}> {unit}</Text>}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  welcomeSection: { marginBottom: 20 },
  welcomeText: { fontSize: 14, color: COLORS.textMuted },
  userName: { fontSize: 24, fontWeight: '700', color: COLORS.primary, marginTop: 2 },
  roleText: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: COLORS.cardLight, borderRadius: 12, padding: 12,
    alignItems: 'center', borderTopWidth: 3, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  statIcon: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 10, color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },
  patientCard: {
    backgroundColor: COLORS.cardLight, borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.borderLight, elevation: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4,
  },
  criticalCard: { borderLeftWidth: 3, borderLeftColor: COLORS.critical },
  patientHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  patientName: { fontSize: 15, fontWeight: '600', color: COLORS.primary },
  patientMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  vitalsRow: { flexDirection: 'row', marginTop: 12, gap: 8 },
  vitalMini: {
    flex: 1, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 8, alignItems: 'center',
  },
  vitalLabel: { fontSize: 9, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  vitalValue: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginTop: 2 },
  vitalUnit: { fontSize: 9, fontWeight: '400', color: COLORS.textMuted },
});
