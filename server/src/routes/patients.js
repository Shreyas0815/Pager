const express = require('express');
const { authMiddleware, adminOnly } = require('../middleware/auth');

function createPatientsRouter(prisma) {
  const router = express.Router();

  // GET /api/patients - List all patients
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const { ward, status, search } = req.query;
      const where = {};

      if (ward) where.ward = ward;
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { bedNumber: { contains: search } },
        ];
      }

      const patients = await prisma.patient.findMany({
        where,
        include: {
          assignments: {
            include: {
              staff: { select: { id: true, name: true, role: true } },
            },
          },
          _count: {
            select: {
              alerts: { where: { acknowledged: false } },
            },
          },
        },
        orderBy: [
          { status: 'asc' },
          { bedNumber: 'asc' },
        ],
      });

      res.json(patients);
    } catch (err) {
      console.error('[Patients] List error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // GET /api/patients/:id - Get patient details
  router.get('/:id', authMiddleware, async (req, res) => {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: req.params.id },
        include: {
          assignments: {
            include: {
              staff: { select: { id: true, name: true, role: true, department: true } },
            },
          },
          equipment: true,
        },
      });

      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      res.json(patient);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // GET /api/patients/:id/vitals - Get vital signs history
  router.get('/:id/vitals', authMiddleware, async (req, res) => {
    try {
      const { limit = 100, from, to } = req.query;
      const where = { patientId: req.params.id };

      if (from || to) {
        where.timestamp = {};
        if (from) where.timestamp.gte = new Date(from);
        if (to) where.timestamp.lte = new Date(to);
      }

      const vitals = await prisma.vitalSign.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit),
      });

      res.json(vitals.reverse());
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // GET /api/patients/:id/vitals/live - Get latest vital reading
  router.get('/:id/vitals/live', authMiddleware, async (req, res) => {
    try {
      const vital = await prisma.vitalSign.findFirst({
        where: { patientId: req.params.id },
        orderBy: { timestamp: 'desc' },
      });

      if (!vital) {
        return res.status(404).json({ error: 'No vital data available' });
      }

      res.json(vital);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // POST /api/patients - Add new patient
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const { name, age, gender, bedNumber, ward, diagnosis } = req.body;
      if (!name || !age || !gender || !bedNumber || !ward) {
        return res.status(400).json({ error: 'Name, age, gender, bedNumber, and ward are required' });
      }

      const existing = await prisma.patient.findUnique({ where: { bedNumber } });
      if (existing) {
        return res.status(409).json({ error: 'Bed number already occupied' });
      }

      const patient = await prisma.patient.create({
        data: { name, age, gender, bedNumber, ward, diagnosis: diagnosis || '' },
      });

      res.status(201).json(patient);
    } catch (err) {
      console.error('[Patients] Create error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // PUT /api/patients/:id - Update patient
  router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const { name, age, gender, ward, diagnosis, status, 
              thresholdHRHigh, thresholdHRLow, thresholdSpO2Low,
              thresholdBPSysHigh, thresholdBPSysLow,
              thresholdTempHigh, thresholdTempLow,
              thresholdRRHigh, thresholdRRLow } = req.body;

      const patient = await prisma.patient.update({
        where: { id: req.params.id },
        data: {
          ...(name && { name }),
          ...(age && { age }),
          ...(gender && { gender }),
          ...(ward && { ward }),
          ...(diagnosis !== undefined && { diagnosis }),
          ...(status && { status }),
          ...(thresholdHRHigh && { thresholdHRHigh }),
          ...(thresholdHRLow && { thresholdHRLow }),
          ...(thresholdSpO2Low && { thresholdSpO2Low }),
          ...(thresholdBPSysHigh && { thresholdBPSysHigh }),
          ...(thresholdBPSysLow && { thresholdBPSysLow }),
          ...(thresholdTempHigh && { thresholdTempHigh }),
          ...(thresholdTempLow && { thresholdTempLow }),
          ...(thresholdRRHigh && { thresholdRRHigh }),
          ...(thresholdRRLow && { thresholdRRLow }),
        },
      });

      res.json(patient);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
}

module.exports = createPatientsRouter;
