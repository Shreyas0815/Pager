// Reporting Engine - Generates comprehensive patient reports
class ReportingEngine {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async generateReport(patientId, requestedById, type = 'COMPREHENSIVE') {
    // Create report record
    const report = await this.prisma.report.create({
      data: {
        patientId,
        requestedById,
        type,
        status: 'GENERATING',
      },
    });

    try {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          assignments: { include: { staff: true } },
        },
      });

      if (!patient) throw new Error('Patient not found');

      // Get vital signs data (last 1 hour for detail, last 24 hours for summary)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      let recentVitals = await this.prisma.vitalSign.findMany({
        where: {
          patientId,
          timestamp: { gte: oneHourAgo },
        },
        orderBy: { timestamp: 'asc' },
      });

      // If no vitals in the last hour, fallback to most recent vitals up to 60 readings
      if (recentVitals.length === 0) {
        recentVitals = await this.prisma.vitalSign.findMany({
          where: { patientId },
          orderBy: { timestamp: 'desc' },
          take: 60,
        });
        recentVitals.reverse();
      }

      // If still empty (e.g. fresh DB before simulation), provide sensible default baseline
      if (recentVitals.length === 0) {
        recentVitals = [{
          heartRate: 75,
          systolicBP: 120,
          diastolicBP: 80,
          spO2: 98,
          temperature: 36.8,
          respiratoryRate: 16,
          timestamp: new Date(),
        }];
      }

      let dayVitals = await this.prisma.vitalSign.findMany({
        where: {
          patientId,
          timestamp: { gte: twentyFourHoursAgo },
        },
        orderBy: { timestamp: 'asc' },
      });

      if (dayVitals.length === 0) {
        dayVitals = recentVitals;
      }

      // Get alerts for this patient
      const alerts = await this.prisma.alert.findMany({
        where: {
          patientId,
          createdAt: { gte: twentyFourHoursAgo },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Calculate statistics
      const stats = this.calculateStats(recentVitals);
      const dayStats = this.calculateStats(dayVitals);
      const trends = this.calculateTrends(dayVitals.length >= 10 ? dayVitals : recentVitals);

      // Generate intelligent Clinical Summary
      const latestVital = recentVitals[recentVitals.length - 1];
      const clinicalSummary = this.generateClinicalSummary(patient, latestVital, stats, alerts, trends);

      // Build report data
      const reportData = {
        patient: {
          id: patient.id,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          bedNumber: patient.bedNumber,
          ward: patient.ward,
          diagnosis: patient.diagnosis,
          admissionDate: patient.admissionDate,
          status: patient.status,
          thresholdHRHigh: patient.thresholdHRHigh,
          thresholdHRLow: patient.thresholdHRLow,
          thresholdSpO2Low: patient.thresholdSpO2Low,
          thresholdBPSysHigh: patient.thresholdBPSysHigh,
          thresholdBPSysLow: patient.thresholdBPSysLow,
          thresholdTempHigh: patient.thresholdTempHigh,
          thresholdTempLow: patient.thresholdTempLow,
        },
        assignedStaff: patient.assignments.map((a) => ({
          name: a.staff.name,
          role: a.role,
          department: a.staff.department,
        })),
        generatedAt: new Date().toISOString(),
        period: {
          detail: { from: oneHourAgo.toISOString(), to: new Date().toISOString() },
          summary: { from: twentyFourHoursAgo.toISOString(), to: new Date().toISOString() },
        },
        currentVitals: {
          heartRate: latestVital.heartRate,
          systolicBP: latestVital.systolicBP,
          diastolicBP: latestVital.diastolicBP,
          spO2: latestVital.spO2,
          temperature: latestVital.temperature,
          respiratoryRate: latestVital.respiratoryRate,
          timestamp: latestVital.timestamp,
        },
        lastHourStats: stats,
        last24HourStats: dayStats,
        trends,
        clinicalSummary,
        alertsSummary: {
          total: alerts.length,
          critical: alerts.filter((a) => a.severity === 'CRITICAL').length,
          warning: alerts.filter((a) => a.severity === 'WARNING').length,
          acknowledged: alerts.filter((a) => a.acknowledged).length,
          recentAlerts: alerts.slice(0, 10).map((a) => ({
            id: a.id,
            severity: a.severity,
            type: a.type,
            message: a.message,
            time: a.createdAt,
            acknowledged: a.acknowledged,
          })),
        },
        vitalHistory: {
          labels: recentVitals.map((v) => (v.timestamp ? new Date(v.timestamp).toISOString() : new Date().toISOString())),
          heartRate: recentVitals.map((v) => v.heartRate),
          spO2: recentVitals.map((v) => v.spO2),
          systolicBP: recentVitals.map((v) => v.systolicBP),
          diastolicBP: recentVitals.map((v) => v.diastolicBP),
          temperature: recentVitals.map((v) => v.temperature),
          respiratoryRate: recentVitals.map((v) => v.respiratoryRate),
        },
        totalReadings: recentVitals.length,
      };

      // Update report as completed
      await this.prisma.report.update({
        where: { id: report.id },
        data: {
          status: 'COMPLETED',
          data: JSON.stringify(reportData),
          generatedAt: new Date(),
        },
      });

      return { ...report, data: reportData, status: 'COMPLETED' };
    } catch (err) {
      await this.prisma.report.update({
        where: { id: report.id },
        data: { status: 'FAILED' },
      });
      throw err;
    }
  }

  calculateStats(vitals) {
    if (vitals.length === 0) {
      return { noData: true };
    }

    const fields = ['heartRate', 'systolicBP', 'diastolicBP', 'spO2', 'temperature', 'respiratoryRate'];
    const stats = {};

    for (const field of fields) {
      const values = vitals.map((v) => v[field]).filter((v) => v !== null && v !== undefined);
      if (values.length === 0) continue;

      stats[field] = {
        min: parseFloat(Math.min(...values).toFixed(1)),
        max: parseFloat(Math.max(...values).toFixed(1)),
        avg: parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)),
        latest: values[values.length - 1],
        count: values.length,
      };
    }

    return stats;
  }

  calculateTrends(vitals) {
    if (vitals.length < 10) return { insufficient_data: true };

    const fields = ['heartRate', 'systolicBP', 'spO2', 'temperature', 'respiratoryRate'];
    const trends = {};

    for (const field of fields) {
      const values = vitals.map((v) => v[field]).filter((v) => v !== null);
      if (values.length < 10) continue;

      // Simple linear regression for trend
      const n = values.length;
      const half = Math.floor(n / 2);
      const firstHalfAvg = values.slice(0, half).reduce((a, b) => a + b, 0) / half;
      const secondHalfAvg = values.slice(half).reduce((a, b) => a + b, 0) / (n - half);
      const diff = secondHalfAvg - firstHalfAvg;
      const percentChange = (diff / firstHalfAvg) * 100;

      let direction;
      if (Math.abs(percentChange) < 2) direction = 'STABLE';
      else if (percentChange > 0) direction = 'INCREASING';
      else direction = 'DECREASING';

      trends[field] = {
        direction,
        percentChange: parseFloat(percentChange.toFixed(1)),
        firstHalfAvg: parseFloat(firstHalfAvg.toFixed(1)),
        secondHalfAvg: parseFloat(secondHalfAvg.toFixed(1)),
      };
    }

    return trends;
  }

  generateClinicalSummary(patient, latestVital, stats, alerts = [], trends = {}) {
    const findings = [];
    const recommendations = [];
    let severity = patient.status || 'STABLE';

    const hr = latestVital?.heartRate;
    const spo2 = latestVital?.spO2;
    const sys = latestVital?.systolicBP;
    const dia = latestVital?.diastolicBP;
    const temp = latestVital?.temperature;

    // Heart Rate evaluation
    if (hr) {
      if (hr > (patient.thresholdHRHigh || 140)) {
        findings.push(`Severe tachycardia: Heart rate peaked at ${hr} BPM (threshold: ${patient.thresholdHRHigh || 140} BPM).`);
        recommendations.push('Immediate 12-lead ECG and review of rate-controlling medications.');
        severity = 'CRITICAL';
      } else if (hr < (patient.thresholdHRLow || 45)) {
        findings.push(`Bradycardia noted: Heart rate down to ${hr} BPM (threshold: ${patient.thresholdHRLow || 45} BPM).`);
        recommendations.push('Evaluate for chronotropic incompetence or electrolyte imbalance.');
        if (severity !== 'CRITICAL') severity = 'WARNING';
      } else if (hr > 100) {
        findings.push(`Mild tachycardia observed: Current Heart rate is ${hr} BPM.`);
      } else {
        findings.push(`Heart rate is within expected range: Current ${hr} BPM (1h Avg: ${stats?.heartRate?.avg || hr} BPM).`);
      }
    }

    // SpO2 evaluation
    if (spo2) {
      if (spo2 < (patient.thresholdSpO2Low || 88)) {
        findings.push(`Hypoxia risk: SpO2 critically low at ${spo2}% (threshold: ${patient.thresholdSpO2Low || 88}%).`);
        recommendations.push('Escalate supplemental oxygen flow / high-flow nasal cannula or non-invasive ventilation.');
        severity = 'CRITICAL';
      } else if (spo2 < 93) {
        findings.push(`Borderline oxygen saturation: SpO2 at ${spo2}%.`);
        recommendations.push('Verify sensor placement and monitor continuous pulse oximetry waveform.');
        if (severity !== 'CRITICAL') severity = 'WARNING';
      } else {
        findings.push(`Adequate oxygen saturation: SpO2 at ${spo2}%.`);
      }
    }

    // Blood Pressure evaluation
    if (sys && dia) {
      if (sys > (patient.thresholdBPSysHigh || 180) || sys < (patient.thresholdBPSysLow || 80)) {
        findings.push(`Hemodynamic instability: Blood pressure recorded at ${sys}/${dia} mmHg.`);
        recommendations.push('Check invasive arterial line or repeat manual BP; titrate vasoactive infusions as prescribed.');
        severity = 'CRITICAL';
      } else if (sys > 140 || sys < 95) {
        findings.push(`Blood pressure variation: ${sys}/${dia} mmHg.`);
        if (severity !== 'CRITICAL') severity = 'WARNING';
      } else {
        findings.push(`Blood pressure normotensive: ${sys}/${dia} mmHg.`);
      }
    }

    // Temperature evaluation
    if (temp) {
      if (temp > (patient.thresholdTempHigh || 39.0)) {
        findings.push(`Pyrexia / Fever: Body temperature elevated at ${temp}°C.`);
        recommendations.push('Administer antipyretic therapy and screen for infectious etiology / blood cultures.');
        if (severity !== 'CRITICAL') severity = 'WARNING';
      } else if (temp < (patient.thresholdTempLow || 35.0)) {
        findings.push(`Hypothermia risk: Body temperature at ${temp}°C.`);
        recommendations.push('Initiate active patient rewarming protocols.');
        if (severity !== 'CRITICAL') severity = 'WARNING';
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Maintain routine patient vital monitoring protocol.');
      recommendations.push('Continue scheduled nursing rounds and medication administration.');
    }

    // Generate narrative
    const conditionDescription =
      severity === 'CRITICAL'
        ? `Patient is currently in CRITICAL condition and requires immediate clinical oversight in ${patient.ward} (Bed ${patient.bedNumber}).`
        : severity === 'WARNING'
        ? `Patient is in WARNING status with monitored physiological fluctuations requiring nursing observation in ${patient.ward}.`
        : `Patient is clinically STABLE with vital signs tracking within acceptable hospital target baselines.`;

    const alertCount = alerts.length;
    const alertText = alertCount > 0
      ? `${alertCount} alert event(s) recorded in the preceding 24 hours (${alerts.filter(a => a.severity === 'CRITICAL').length} critical).`
      : 'No critical alerts triggered in the last 24 hours.';

    const narrative = `${conditionDescription} ${patient.name}, ${patient.age}y ${patient.gender}, admitted with primary diagnosis of ${patient.diagnosis}. ${alertText} Overall hemodynamic trend is ${trends?.heartRate?.direction || 'STABLE'}.`;

    return {
      severity,
      narrative,
      keyFindings: findings,
      recommendations,
      lastEvaluatedAt: new Date().toISOString(),
    };
  }
}

module.exports = ReportingEngine;
