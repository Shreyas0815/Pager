import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../utils/constants';

export default function ReportScreen({ route }) {
  const { reportData, patientName } = route.params || {};

  if (!reportData) {
    return (
      <View style={s.center}>
        <Text style={s.noData}>No report data available</Text>
      </View>
    );
  }

  const data = reportData;
  const stats = data.lastHourStats || {};
  const trends = data.trends || {};

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={s.header}>
        <Text style={s.title}>📊 Patient Report</Text>
        <Text style={s.sub}>{data.patient?.name || patientName}</Text>
        <Text style={s.meta}>
          Bed {data.patient?.bedNumber} • {data.patient?.ward} • Generated {new Date(data.generatedAt).toLocaleString()}
        </Text>
      </View>

      {/* Patient Info */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Patient Information</Text>
        <Row label="Name" value={data.patient?.name} />
        <Row label="Age / Gender" value={`${data.patient?.age}y ${data.patient?.gender}`} />
        <Row label="Diagnosis" value={data.patient?.diagnosis} />
        <Row label="Status" value={data.patient?.status} />
        <Row label="Admission" value={new Date(data.patient?.admissionDate).toLocaleDateString()} />
      </View>

      {/* Current Vitals */}
      {data.currentVitals && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Current Vitals</Text>
          <Row label="Heart Rate" value={`${data.currentVitals.heartRate} BPM`} />
          <Row label="SpO2" value={`${data.currentVitals.spO2}%`} />
          <Row label="Blood Pressure" value={`${data.currentVitals.systolicBP}/${data.currentVitals.diastolicBP} mmHg`} />
          <Row label="Temperature" value={`${data.currentVitals.temperature}°C`} />
          <Row label="Resp. Rate" value={`${data.currentVitals.respiratoryRate}/min`} />
        </View>
      )}

      {/* Statistics */}
      {stats && !stats.noData && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Last Hour Statistics</Text>
          {Object.entries(stats).map(([key, val]) => (
            <View key={key} style={s.statRow}>
              <Text style={s.statKey}>{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
              <Text style={s.statVal}>
                Avg: {val.avg} | Min: {val.min} | Max: {val.max}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Trends */}
      {trends && !trends.insufficient_data && Object.keys(trends).length > 0 && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Trends</Text>
          {Object.entries(trends).map(([key, t]) => (
            <View key={key} style={s.trendRow}>
              <Text style={s.trendKey}>{key.replace(/([A-Z])/g, ' $1')}</Text>
              <Text style={[s.trendVal, {
                color: t.direction === 'STABLE' ? COLORS.accent :
                       t.direction === 'INCREASING' ? COLORS.warning : COLORS.critical
              }]}>
                {t.direction} ({t.percentChange > 0 ? '+' : ''}{t.percentChange}%)
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Alert Summary */}
      {data.alertsSummary && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Alert Summary</Text>
          <Row label="Total Alerts" value={data.alertsSummary.total} />
          <Row label="Critical" value={data.alertsSummary.critical} />
          <Row label="Warning" value={data.alertsSummary.warning} />
          <Row label="Acknowledged" value={data.alertsSummary.acknowledged} />
        </View>
      )}

      <Text style={s.footer}>
        Total Readings: {data.totalReadings || 0} • Report ID generated at {new Date().toLocaleTimeString()}
      </Text>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Row({ label, value }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value ?? '--'}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 100 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noData: { color: COLORS.textMuted, fontSize: 14 },
  header: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.primary },
  sub: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary, marginTop: 4 },
  meta: { fontSize: 11, color: COLORS.textMuted, marginTop: 4 },
  card: {
    backgroundColor: COLORS.cardLight, borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.borderLight, elevation: 1,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowLabel: { fontSize: 13, color: COLORS.textMuted },
  rowValue: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  statRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  statKey: { fontSize: 12, fontWeight: '600', color: COLORS.primary, textTransform: 'capitalize' },
  statVal: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  trendKey: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'capitalize' },
  trendVal: { fontSize: 12, fontWeight: '600' },
  footer: { fontSize: 10, color: COLORS.textMuted, textAlign: 'center', marginTop: 16 },
});
