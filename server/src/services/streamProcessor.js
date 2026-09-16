// Stream Processor - Receives raw vital data, stores it, forwards to alerting and clients
class StreamProcessor {
  constructor(prisma, wsHandler, alertingEngine) {
    this.prisma = prisma;
    this.wsHandler = wsHandler;
    this.alertingEngine = alertingEngine;
    this.processedCount = 0;
  }

  setAlertingEngine(alertingEngine) {
    this.alertingEngine = alertingEngine;
  }

  async process(vitalData, patient) {
    try {
      // 1. Store in database
      const vitalRecord = await this.prisma.vitalSign.create({
        data: {
          patientId: vitalData.patientId,
          heartRate: vitalData.heartRate,
          systolicBP: vitalData.systolicBP,
          diastolicBP: vitalData.diastolicBP,
          spO2: vitalData.spO2,
          temperature: vitalData.temperature,
          respiratoryRate: vitalData.respiratoryRate,
          ecgData: vitalData.ecgData,
        },
      });

      this.processedCount++;

      // 2. Run through alerting engine to determine fresh status and trigger any alerts
      let currentStatus = patient.status;
      if (this.alertingEngine) {
        currentStatus = await this.alertingEngine.analyze(vitalData, patient);
      }

      // 3. Broadcast to all WebSocket clients with fresh patientStatus
      this.wsHandler.broadcast('vitals', {
        ...vitalData,
        id: vitalRecord.id,
        timestamp: vitalRecord.timestamp.toISOString(),
        patientStatus: currentStatus || patient.status,
      });

      // 4. Cleanup old records (keep last 24 hours in detail, older in summary)
      // This runs every 1000 records to avoid performance impact
      if (this.processedCount % 1000 === 0) {
        await this.cleanupOldRecords();
      }
    } catch (err) {
      console.error('[StreamProcessor] Error processing vital data:', err.message);
    }
  }

  async cleanupOldRecords() {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
      const result = await this.prisma.vitalSign.deleteMany({
        where: { timestamp: { lt: cutoff } },
      });
      if (result.count > 0) {
        console.log(`[StreamProcessor] Cleaned up ${result.count} old vital records`);
      }
    } catch (err) {
      console.error('[StreamProcessor] Cleanup error:', err.message);
    }
  }

  getStats() {
    return {
      processedCount: this.processedCount,
      status: 'RUNNING',
    };
  }
}

module.exports = StreamProcessor;
