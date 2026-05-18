// Equipment Simulator - Simulates medical devices streaming patient vital data
class EquipmentSimulator {
  constructor(prisma, wsHandler, streamProcessor) {
    this.prisma = prisma;
    this.wsHandler = wsHandler;
    this.streamProcessor = streamProcessor;
    this.interval = null;
    this.patientStates = new Map(); // patientId -> current baseline vitals
    this.anomalyChance = 0.03; // 3% chance of anomaly per tick
  }

  async start() {
    console.log('[EquipmentSimulator] Starting medical equipment simulation...');
    
    // Initialize patient baseline vitals
    const patients = await this.prisma.patient.findMany({
      where: { status: { not: 'DISCHARGED' } },
      include: { equipment: true },
    });

    patients.forEach((patient) => {
      this.patientStates.set(patient.id, {
        heartRate: 72 + Math.random() * 15,
        systolicBP: 120 + Math.random() * 10,
        diastolicBP: 78 + Math.random() * 8,
        spO2: 97 + Math.random() * 2,
        temperature: 36.5 + Math.random() * 0.5,
        respiratoryRate: 16 + Math.random() * 4,
        ecgPhase: 0,
      });
    });

    // Stream data every 2 seconds
    this.interval = setInterval(() => this.generateVitals(), 2000);
    console.log(`[EquipmentSimulator] Monitoring ${patients.length} patients`);
  }

  generateECGWaveform(phase) {
    // Simplified ECG PQRST waveform generation
    const points = [];
    for (let i = 0; i < 50; i++) {
      const t = (phase + i) / 50;
      const cycle = t % 1;
      let value = 0;

      if (cycle < 0.1) { // P wave
        value = 0.15 * Math.sin(cycle * Math.PI / 0.1);
      } else if (cycle < 0.15) { // PR segment
        value = 0;
      } else if (cycle < 0.18) { // Q wave
        value = -0.1 * Math.sin((cycle - 0.15) * Math.PI / 0.03);
      } else if (cycle < 0.22) { // R wave (main spike)
        value = 1.0 * Math.sin((cycle - 0.18) * Math.PI / 0.04);
      } else if (cycle < 0.26) { // S wave
        value = -0.2 * Math.sin((cycle - 0.22) * Math.PI / 0.04);
      } else if (cycle < 0.35) { // ST segment
        value = 0.02;
      } else if (cycle < 0.55) { // T wave
        value = 0.3 * Math.sin((cycle - 0.35) * Math.PI / 0.2);
      } else {
        value = 0;
      }

      // Add some noise
      value += (Math.random() - 0.5) * 0.03;
      points.push(parseFloat(value.toFixed(3)));
    }
    return points;
  }

  async generateVitals() {
    const patients = await this.prisma.patient.findMany({
      where: { status: { not: 'DISCHARGED' } },
    });

    for (const patient of patients) {
      let state = this.patientStates.get(patient.id);
      if (!state) {
        state = {
          heartRate: 75,
          systolicBP: 120,
          diastolicBP: 80,
          spO2: 97,
          temperature: 36.6,
          respiratoryRate: 16,
          ecgPhase: 0,
        };
        this.patientStates.set(patient.id, state);
      }

      // Determine if anomaly occurs
      const isAnomaly = Math.random() < this.anomalyChance;

      // Generate natural drift with small random walk
      state.heartRate = this.drift(state.heartRate, 60, 100, 1.5, isAnomaly ? 40 : 0);
      state.systolicBP = this.drift(state.systolicBP, 100, 140, 2, isAnomaly ? 30 : 0);
      state.diastolicBP = this.drift(state.diastolicBP, 60, 90, 1.5, isAnomaly ? 20 : 0);
      state.spO2 = this.drift(state.spO2, 95, 100, 0.3, isAnomaly ? -8 : 0);
      state.temperature = this.drift(state.temperature, 36.0, 37.5, 0.1, isAnomaly ? 2 : 0);
      state.respiratoryRate = this.drift(state.respiratoryRate, 12, 20, 0.5, isAnomaly ? 8 : 0);
      state.ecgPhase = (state.ecgPhase + 1) % 1000;

      // Clamp values
      state.spO2 = Math.min(100, Math.max(70, state.spO2));
      state.heartRate = Math.max(30, state.heartRate);
      state.temperature = Math.max(33, state.temperature);

      const ecgData = this.generateECGWaveform(state.ecgPhase);

      const vitalData = {
        patientId: patient.id,
        heartRate: parseFloat(state.heartRate.toFixed(1)),
        systolicBP: parseFloat(state.systolicBP.toFixed(0)),
        diastolicBP: parseFloat(state.diastolicBP.toFixed(0)),
        spO2: parseFloat(state.spO2.toFixed(1)),
        temperature: parseFloat(state.temperature.toFixed(1)),
        respiratoryRate: parseFloat(state.respiratoryRate.toFixed(1)),
        ecgData: JSON.stringify(ecgData),
        bedNumber: patient.bedNumber,
        patientName: patient.name,
        ward: patient.ward,
      };

      // Process through stream processor
      await this.streamProcessor.process(vitalData, patient);
    }

    // Update equipment status ping
    await this.prisma.equipment.updateMany({
      where: { status: 'ONLINE' },
      data: { lastPingAt: new Date() },
    });
  }

  drift(value, min, max, maxDelta, anomalyShift) {
    const center = (min + max) / 2;
    const pullToCenter = (center - value) * 0.02; // gentle pull to center
    const randomWalk = (Math.random() - 0.5) * maxDelta * 2;
    let newValue = value + pullToCenter + randomWalk + anomalyShift;
    return newValue;
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    console.log('[EquipmentSimulator] Stopped');
  }
}

module.exports = EquipmentSimulator;
