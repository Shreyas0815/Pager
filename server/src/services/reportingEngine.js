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

      const recentVitals = await this.prisma.vitalSign.findMany({
        where: {
          patientId,
          timestamp: { gte: oneHourAgo },
        },
        orderBy: { timestamp: 'asc' },
      });

      const dayVitals = await this.prisma.vitalSign.findMany({
        where: {
          patientId,
          timestamp: { gte: twentyFourHoursAgo },
        },
        orderBy: { timestamp: 'asc' },
      });

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
      const trends = this.calculateTrends(dayVitals);

      // Build report data
      const reportData = {
        patient: {
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          bedNumber: patient.bedNumber,
          ward: patient.ward,
          diagnosis: patient.diagnosis,
          admissionDate: patient.admissionDate,
          status: patient.status,
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
        currentVitals: recentVitals.length > 0 ? {
          heartRate: recentVitals[recentVitals.length - 1].heartRate,
          systolicBP: recentVitals[recentVitals.length - 1].systolicBP,
          diastolicBP: recentVitals[recentVitals.length - 1].diastolicBP,
          spO2: recentVitals[recentVitals.length - 1].spO2,
          temperature: recentVitals[recentVitals.length - 1].temperature,
          respiratoryRate: recentVitals[recentVitals.length - 1].respiratoryRate,
        } : null,
        lastHourStats: stats,
        last24HourStats: dayStats,
        trends,
        alertsSummary: {
          total: alerts.length,
          critical: alerts.filter((a) => a.severity === 'CRITICAL').length,
          warning: alerts.filter((a) => a.severity === 'WARNING').length,
          acknowledged: alerts.filter((a) => a.acknowledged).length,
          recentAlerts: alerts.slice(0, 10).map((a) => ({
            severity: a.severity,
            type: a.type,
            message: a.message,
            time: a.createdAt,
            acknowledged: a.acknowledged,
          })),
        },
        vitalHistory: {
          labels: recentVitals.map((v) => v.timestamp.toISOString()),
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
}

module.exports = ReportingEngine;
