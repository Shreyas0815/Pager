const express = require('express');
const { authMiddleware } = require('../middleware/auth');

function createAlertsRouter(prisma) {
  const router = express.Router();

  // GET /api/alerts - List alerts
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const { severity, acknowledged, patientId, limit = 50 } = req.query;
      const where = {};

      if (severity) where.severity = severity;
      if (acknowledged !== undefined) where.acknowledged = acknowledged === 'true';
      if (patientId) where.patientId = patientId;

      const alerts = await prisma.alert.findMany({
        where,
        include: {
          patient: { select: { id: true, name: true, bedNumber: true, ward: true } },
          acknowledgedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
      });

      res.json(alerts);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // GET /api/alerts/summary - Alert summary stats
  router.get('/summary', authMiddleware, async (req, res) => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const [total, critical, warning, unacknowledged, recentCount] = await Promise.all([
        prisma.alert.count(),
        prisma.alert.count({ where: { severity: 'CRITICAL', acknowledged: false } }),
        prisma.alert.count({ where: { severity: 'WARNING', acknowledged: false } }),
        prisma.alert.count({ where: { acknowledged: false } }),
        prisma.alert.count({ where: { createdAt: { gte: oneHourAgo } } }),
      ]);

      res.json({ total, critical, warning, unacknowledged, recentCount });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // POST /api/alerts/:id/acknowledge - Acknowledge an alert
  router.post('/:id/acknowledge', authMiddleware, async (req, res) => {
    try {
      const alert = await prisma.alert.update({
        where: { id: req.params.id },
        data: {
          acknowledged: true,
          acknowledgedById: req.user.id,
          acknowledgedAt: new Date(),
        },
        include: {
          patient: { select: { id: true, name: true, bedNumber: true } },
        },
      });

      // Check if all critical alerts for this patient are acknowledged
      const unacknowledgedCritical = await prisma.alert.count({
        where: {
          patientId: alert.patientId,
          severity: 'CRITICAL',
          acknowledged: false,
        },
      });

      // If no more critical alerts, downgrade patient status
      if (unacknowledgedCritical === 0) {
        const unacknowledgedWarning = await prisma.alert.count({
          where: {
            patientId: alert.patientId,
            severity: 'WARNING',
            acknowledged: false,
          },
        });

        await prisma.patient.update({
          where: { id: alert.patientId },
          data: { status: unacknowledgedWarning > 0 ? 'WARNING' : 'STABLE' },
        });
      }

      res.json(alert);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
}

module.exports = createAlertsRouter;
