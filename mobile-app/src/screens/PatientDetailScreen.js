import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { COLORS, getStatusColor, getVitalStatus } from '../utils/constants';
import api from '../services/api';
import wsService from '../services/websocket';

const screenWidth = Dimensions.get('window').width;

export default function PatientDetailScreen({ route, navigation }) {
  const { patientId } = route.params;
  const [patient, setPatient] = useState(null);
  const [currentVitals, setCurrentVitals] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [report, setReport] = useState(null);
  const [vitalHistory, setVitalHistory] = useState([]);

  useEffect(() => {
    loadData();
    const unsub = wsService.on('vitals', (data) => {
      if (data.patientId === patientId) {
        setCurrentVitals(data);
        setVitalHistory(prev => [...prev, data].slice(-30));
      }
    });
    return unsub;
  }, [patientId]);

  async function loadData() {
    try {
      const [p, a, v] = await Promise.all([
        api.getPatient(patientId),
        api.getAlerts({ patientId, limit: '15' }),
        api.getPatientVitals(patientId, { limit: '30' }),
      ]);
      setPatient(p);
      setAlerts(a);
      if (v.length > 0) {
        setCurrentVitals(v[v.length - 1]);
        setVitalHistory(v);
      }
    } catch (err) {
      console.log('Patient load error:', err.message);
    }
    setLoading(false);
  }

  async function handleGenerateReport() {
    setGeneratingReport(true);
    try {
      const r = await api.generateReport(patientId, 'COMPREHENSIVE');
      setReport(r.data || r);
      navigation.navigate('Report', { reportData: r.data || r, patientName: patient?.name });
    } catch (err) {
      console.log('Report error:', err.message);
    }
    setGeneratingReport(false);
  }

  async function handleAcknowledge(alertId) {
    try {
      await api.acknowledgeAlert(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, acknowledged: true } : a));
    } catch (err) {
      console.log('Acknowledge error:', err.message);
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!patient) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: COLORS.textMuted }}>Patient not found</Text>
      </View>
    );
  }

  const vitals = currentVitals || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Patient Info */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientMeta}>
              {patient.age}y • {patient.gender} • Bed {patient.bedNumber}
            </Text>
            <Text style={styles.diagnosis}>{patient.diagnosis}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(patient.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(patient.status) }]}>{patient.status}</Text>
          </View>
        </View>

        {/* Assigned Staff */}
        {patient.assignments?.length > 0 && (
          <View style={styles.staffSection}>
            <Text style={styles.miniTitle}>Assigned Staff</Text>
            {patient.assignments.map(a => (
              <Text key={a.id} style={styles.staffText}>
                👨‍⚕️ {a.staff.name} — {a.role.replace(/_/g, ' ')}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Live Vitals Grid */}
      <Text style={styles.sectionTitle}>💓 Live Vital Signs</Text>
      <View style={styles.vitalsGrid}>
        {[
          { label: 'Heart Rate', key: 'heartRate', unit: 'BPM', icon: '❤️', color: '#ff3b5c' },
          { label: 'SpO2', key: 'spO2', unit: '%', icon: '🫁', color: '#3b82f6' },
          { label: 'Systolic BP', key: 'systolicBP', unit: 'mmHg', icon: '🩸', color: '#8b5cf6' },
          { label: 'Diastolic BP', key: 'diastolicBP', unit: 'mmHg', icon: '🩸', color: '#a855f7' },
          { label: 'Temperature', key: 'temperature', unit: '°C', icon: '🌡️', color: '#ffb020' },
          { label: 'Resp Rate', key: 'respiratoryRate', unit: '/min', icon: '💨', color: '#00d4aa' },
        ].map(vital => {
          const value = vitals[vital.key];
          const status = getVitalStatus(vital.key, value);
          return (
            <View key={vital.key} style={[styles.vitalCard, { borderTopColor: vital.color, borderTopWidth: 3 }]}>
              <Text style={styles.vitalIcon}>{vital.icon}</Text>
              <Text style={styles.vitalLabel}>{vital.label}</Text>
              <Text style={[styles.vitalValue, { color: status === 'critical' ? COLORS.critical : status === 'warning' ? COLORS.warning : COLORS.primary }]}>
                {value ?? '--'}
              </Text>
              <Text style={styles.vitalUnit}>{vital.unit}</Text>
            </View>
          );
        })}
      </View>

      {/* Mini Trend (text-based since we're keeping it simple) */}
      {vitalHistory.length > 5 && (
        <View style={styles.trendCard}>
          <Text style={styles.miniTitle}>📈 Trend (Last {vitalHistory.length} readings)</Text>
          <View style={styles.trendRow}>
            <TrendItem label="HR" values={vitalHistory.map(v => v.heartRate).filter(Boolean)} />
            <TrendItem label="SpO2" values={vitalHistory.map(v => v.spO2).filter(Boolean)} />
            <TrendItem label="Temp" values={vitalHistory.map(v => v.temperature).filter(Boolean)} />
          </View>
        </View>
      )}

      {/* Generate Report Button */}
      <TouchableOpacity
        style={styles.reportBtn}
        onPress={handleGenerateReport}
        disabled={generatingReport}
        activeOpacity={0.8}
      >
        {generatingReport ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : (
          <Text style={styles.reportBtnText}>📄 Generate Detailed Report</Text>
        )}
      </TouchableOpacity>

      {/* Alerts */}
      <Text style={styles.sectionTitle}>🚨 Alert History</Text>
      {alerts.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No alerts for this patient</Text>
        </View>
      ) : (
        alerts.map(alert => (
          <View
            key={alert.id}
            style={[
              styles.alertCard,
              alert.severity === 'CRITICAL' && styles.alertCritical,
              alert.severity === 'WARNING' && styles.alertWarning,
            ]}
          >
            <View style={styles.alertContent}>
              <Text style={styles.alertIcon}>
                {alert.severity === 'CRITICAL' ? '🔴' : '🟡'}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertMessage}>{alert.message}</Text>
                <Text style={styles.alertTime}>
                  {new Date(alert.createdAt).toLocaleString()}
                  {alert.acknowledged && ' • ✅ Acknowledged'}
                </Text>
              </View>
            </View>
            {!alert.acknowledged && (
              <TouchableOpacity
                style={styles.ackBtn}
                onPress={() => handleAcknowledge(alert.id)}
              >
                <Text style={styles.ackBtnText}>ACK</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function TrendItem({ label, values }) {
  if (values.length < 2) return null;
  const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  const min = Math.min(...values).toFixed(1);
  const max = Math.max(...values).toFixed(1);
  const latest = values[values.length - 1];
  const prev = values[values.length - 2];
  const trend = latest > prev ? '↑' : latest < prev ? '↓' : '→';
  const trendColor = latest > prev ? COLORS.critical : latest < prev ? COLORS.accent : COLORS.textMuted;

  return (
    <View style={styles.trendItem}>
      <Text style={styles.trendLabel}>{label}</Text>
      <Text style={[styles.trendArrow, { color: trendColor }]}>{trend} {latest}</Text>
      <Text style={styles.trendMeta}>Avg: {avg} | {min}-{max}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 100 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  infoCard: {
    backgroundColor: COLORS.cardLight, borderRadius: 14, padding: 18,
    marginBottom: 20, borderWidth: 1, borderColor: COLORS.borderLight,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6,
  },
  infoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  patientName: { fontSize: 20, fontWeight: '700', color: COLORS.primary },
  patientMeta: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  diagnosis: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, fontStyle: 'italic' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  staffSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: COLORS.borderLight },
  miniTitle: { fontSize: 12, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  staffText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary, marginBottom: 12 },
  vitalsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  vitalCard: {
    width: (screenWidth - 52) / 3, backgroundColor: COLORS.cardLight, borderRadius: 12,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3,
  },
  vitalIcon: { fontSize: 18, marginBottom: 4 },
  vitalLabel: { fontSize: 9, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  vitalValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary, marginTop: 4 },
  vitalUnit: { fontSize: 10, color: COLORS.textMuted, marginTop: 2 },
  trendCard: {
    backgroundColor: COLORS.cardLight, borderRadius: 12, padding: 16,
    marginBottom: 20, borderWidth: 1, borderColor: COLORS.borderLight,
  },
  trendRow: { flexDirection: 'row', gap: 10 },
  trendItem: { flex: 1, alignItems: 'center', padding: 8, backgroundColor: '#f1f5f9', borderRadius: 8 },
  trendLabel: { fontSize: 10, fontWeight: '600', color: COLORS.textMuted, textTransform: 'uppercase' },
  trendArrow: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  trendMeta: { fontSize: 9, color: COLORS.textMuted, marginTop: 2 },
  reportBtn: {
    backgroundColor: '#1e40af', borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginBottom: 24,
  },
  reportBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  alertCard: {
    backgroundColor: COLORS.cardLight, borderRadius: 10, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: COLORS.borderLight,
    flexDirection: 'row', alignItems: 'center',
  },
  alertCritical: { borderLeftWidth: 3, borderLeftColor: COLORS.critical },
  alertWarning: { borderLeftWidth: 3, borderLeftColor: COLORS.warning },
  alertContent: { flex: 1, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  alertIcon: { fontSize: 16 },
  alertMessage: { fontSize: 13, fontWeight: '500', color: COLORS.primary },
  alertTime: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  ackBtn: {
    backgroundColor: 'rgba(30,64,175,0.08)', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 6, marginLeft: 8,
  },
  ackBtnText: { fontSize: 11, fontWeight: '700', color: '#1e40af' },
  emptyCard: {
    backgroundColor: COLORS.cardLight, borderRadius: 10, padding: 30,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.borderLight,
  },
  emptyText: { fontSize: 13, color: COLORS.textMuted },
});
