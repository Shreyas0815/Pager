// Alerting Engine - Analyzes vital signs against patient-specific thresholds
class AlertingEngine {
  constructor(prisma, wsHandler, notificationGateway) {
    this.prisma = prisma;
    this.wsHandler = wsHandler;
    this.notificationGateway = notificationGateway;
    this.recentAlerts = new Map(); // patientId-type -> timestamp (debounce)
    this.alertCooldown = 5000; // 5 seconds between same alert type for same patient
    this.alertsTriggered = 0;
  }

  async analyze(vitalData, patient) {
    const alerts = [];

    // Heart Rate checks
    if (vitalData.heartRate > patient.thresholdHRHigh) {
      alerts.push({
        type: 'HEART_RATE',
        severity: vitalData.heartRate > 200 ? 'CRITICAL' : 'WARNING',
        vitalType: 'heartRate',
        vitalValue: vitalData.heartRate,
        threshold: patient.thresholdHRHigh,
        message: `Heart rate critically high: ${vitalData.heartRate} BPM (threshold: ${patient.thresholdHRHigh})`,
      });
    } else if (vitalData.heartRate < patient.thresholdHRLow) {
      alerts.push({
        type: 'HEART_RATE',
        severity: vitalData.heartRate < 30 ? 'CRITICAL' : 'WARNING',
        vitalType: 'heartRate',
        vitalValue: vitalData.heartRate,
        threshold: patient.thresholdHRLow,
        message: `Heart rate critically low: ${vitalData.heartRate} BPM (threshold: ${patient.thresholdHRLow})`,
      });
    }

    // SpO2 checks
    if (vitalData.spO2 < patient.thresholdSpO2Low) {
      alerts.push({
        type: 'SPO2',
        severity: vitalData.spO2 < 80 ? 'CRITICAL' : 'WARNING',
        vitalType: 'spO2',
        vitalValue: vitalData.spO2,
        threshold: patient.thresholdSpO2Low,
        message: `SpO2 critically low: ${vitalData.spO2}% (threshold: ${patient.thresholdSpO2Low}%)`,
      });
    }

    // Blood Pressure checks
    if (vitalData.systolicBP > patient.thresholdBPSysHigh) {
      alerts.push({
        type: 'BLOOD_PRESSURE',
        severity: vitalData.systolicBP > 220 ? 'CRITICAL' : 'WARNING',
        vitalType: 'systolicBP',
        vitalValue: vitalData.systolicBP,
        threshold: patient.thresholdBPSysHigh,
        message: `Systolic BP critically high: ${vitalData.systolicBP} mmHg (threshold: ${patient.thresholdBPSysHigh})`,
      });
    } else if (vitalData.systolicBP < patient.thresholdBPSysLow) {
      alerts.push({
        type: 'BLOOD_PRESSURE',
        severity: vitalData.systolicBP < 60 ? 'CRITICAL' : 'WARNING',
        vitalType: 'systolicBP',
        vitalValue: vitalData.systolicBP,
        threshold: patient.thresholdBPSysLow,
        message: `Systolic BP critically low: ${vitalData.systolicBP} mmHg (threshold: ${patient.thresholdBPSysLow})`,
      });
    }

    // Temperature checks
    if (vitalData.temperature > patient.thresholdTempHigh) {
      alerts.push({
        type: 'TEMPERATURE',
        severity: vitalData.temperature > 41 ? 'CRITICAL' : 'WARNING',
        vitalType: 'temperature',
        vitalValue: vitalData.temperature,
        threshold: patient.thresholdTempHigh,
        message: `Temperature high: ${vitalData.temperature}°C (threshold: ${patient.thresholdTempHigh}°C)`,
      });
    } else if (vitalData.temperature < patient.thresholdTempLow) {
      alerts.push({
        type: 'TEMPERATURE',
        severity: vitalData.temperature < 33 ? 'CRITICAL' : 'WARNING',
        vitalType: 'temperature',
        vitalValue: vitalData.temperature,
        threshold: patient.thresholdTempLow,
        message: `Temperature low: ${vitalData.temperature}°C (threshold: ${patient.thresholdTempLow}°C)`,
      });
    }

    // Respiratory Rate checks
    if (vitalData.respiratoryRate > patient.thresholdRRHigh) {
      alerts.push({
        type: 'RESPIRATORY_RATE',
        severity: vitalData.respiratoryRate > 35 ? 'CRITICAL' : 'WARNING',
        vitalType: 'respiratoryRate',
        vitalValue: vitalData.respiratoryRate,
        threshold: patient.thresholdRRHigh,
        message: `Respiratory rate high: ${vitalData.respiratoryRate}/min (threshold: ${patient.thresholdRRHigh})`,
      });
    } else if (vitalData.respiratoryRate < patient.thresholdRRLow) {
      alerts.push({
        type: 'RESPIRATORY_RATE',
        severity: vitalData.respiratoryRate < 6 ? 'CRITICAL' : 'WARNING',
        vitalType: 'respiratoryRate',
        vitalValue: vitalData.respiratoryRate,
        threshold: patient.thresholdRRLow,
        message: `Respiratory rate low: ${vitalData.respiratoryRate}/min (threshold: ${patient.thresholdRRLow})`,
      });
    }

    // Determine target clinical status from current vitals
    let targetStatus = 'STABLE';
    if (alerts.some(a => a.severity === 'CRITICAL')) {
      targetStatus = 'CRITICAL';
    } else if (alerts.some(a => a.severity === 'WARNING')) {
      targetStatus = 'WARNING';
    }

    // Status transition handling: update whenever condition changes (e.g. gets critical, warning, or normalizes to stable)
    if (targetStatus !== patient.status) {
      const oldStatus = patient.status;
      patient.status = targetStatus;

      try {
        await this.prisma.patient.update({
          where: { id: patient.id },
          data: { status: targetStatus },
        });

        // Broadcast patient status update to all connected clients immediately
        this.wsHandler.broadcast('patient-status', {
          patientId: patient.id,
          status: targetStatus,
          previousStatus: oldStatus,
          patientName: patient.name,
          bedNumber: patient.bedNumber,
        });

        console.log(`[AlertingEngine] Patient ${patient.name} (Bed ${patient.bedNumber}) status transition: ${oldStatus} -> ${targetStatus}`);
      } catch (err) {
        console.error('[AlertingEngine] Error updating patient status:', err.message);
      }
    }

    // Process alerts with debouncing for alert list / notifications
    for (const alert of alerts) {
      await this.triggerAlert(alert, patient);
    }

    return targetStatus;
  }

  async triggerAlert(alertData, patient) {
    const key = `${patient.id}-${alertData.type}`;
    const lastAlert = this.recentAlerts.get(key);
    const now = Date.now();

    // Debounce: don't fire same alert type for same patient within cooldown
    if (lastAlert && (now - lastAlert) < this.alertCooldown) {
      return;
    }

    this.recentAlerts.set(key, now);
    this.alertsTriggered++;

    try {
      // Store alert in database
      const alert = await this.prisma.alert.create({
        data: {
          patientId: patient.id,
          type: alertData.type,
          severity: alertData.severity,
          message: alertData.message,
          vitalType: alertData.vitalType,
          vitalValue: alertData.vitalValue,
          threshold: alertData.threshold,
        },
      });

      // Broadcast alert via WebSocket
      this.wsHandler.broadcast('alerts', {
        ...alert,
        patientName: patient.name,
        bedNumber: patient.bedNumber,
        ward: patient.ward,
      });

      // Send push notification to assigned staff
      if (alertData.severity === 'CRITICAL') {
        await this.notificationGateway.sendCriticalAlert(alert, patient);
      }

      console.log(`[AlertingEngine] ${alertData.severity} alert for ${patient.name} (Bed ${patient.bedNumber}): ${alertData.message}`);
    } catch (err) {
      console.error('[AlertingEngine] Error creating alert:', err.message);
    }
  }

  getStats() {
    return {
      alertsTriggered: this.alertsTriggered,
      activeDebounces: this.recentAlerts.size,
      status: 'RUNNING',
    };
  }
}

module.exports = AlertingEngine;
