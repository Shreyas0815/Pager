const express = require('express');
const { authMiddleware } = require('../middleware/auth');

function createReportsRouter(prisma, reportingEngine) {
  const router = express.Router();

  // POST /api/reports/generate/:patientId - Generate report
  router.post('/generate/:patientId', authMiddleware, async (req, res) => {
    try {
      const { type } = req.body;
      const report = await reportingEngine.generateReport(
        req.params.patientId,
        req.user.id,
        type || 'COMPREHENSIVE'
      );

      res.json(report);
    } catch (err) {
      console.error('[Reports] Generate error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate report' });
    }
  });

  // GET /api/reports - List reports
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const { patientId, limit = 20 } = req.query;
      const where = {};
      if (patientId) where.patientId = patientId;

      const reports = await prisma.report.findMany({
        where,
        include: {
          patient: { select: { id: true, name: true, bedNumber: true, ward: true } },
          requestedBy: { select: { id: true, name: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
      });

      // Parse JSON data field
      const parsed = reports.map((r) => ({
        ...r,
        data: r.data ? JSON.parse(r.data) : null,
      }));

      res.json(parsed);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // GET /api/reports/:id - Get specific report
  router.get('/:id', authMiddleware, async (req, res) => {
    try {
      const report = await prisma.report.findUnique({
        where: { id: req.params.id },
        include: {
          patient: true,
          requestedBy: { select: { id: true, name: true, role: true } },
        },
      });

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      res.json({
        ...report,
        data: report.data ? JSON.parse(report.data) : null,
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
}

module.exports = createReportsRouter;
