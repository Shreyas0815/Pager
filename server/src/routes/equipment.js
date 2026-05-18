const express = require('express');
const { authMiddleware } = require('../middleware/auth');

function createEquipmentRouter(prisma) {
  const router = express.Router();

  // GET /api/equipment - List all equipment
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const { status, type, bedNumber } = req.query;
      const where = {};
      if (status) where.status = status;
      if (type) where.type = type;
      if (bedNumber) where.bedNumber = bedNumber;

      const equipment = await prisma.equipment.findMany({
        where,
        include: {
          patient: { select: { id: true, name: true, bedNumber: true, ward: true } },
        },
        orderBy: { bedNumber: 'asc' },
      });

      res.json(equipment);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // GET /api/equipment/status - System-wide equipment health summary
  router.get('/status', authMiddleware, async (req, res) => {
    try {
      const [total, online, offline, error, maintenance] = await Promise.all([
        prisma.equipment.count(),
        prisma.equipment.count({ where: { status: 'ONLINE' } }),
        prisma.equipment.count({ where: { status: 'OFFLINE' } }),
        prisma.equipment.count({ where: { status: 'ERROR' } }),
        prisma.equipment.count({ where: { status: 'MAINTENANCE' } }),
      ]);

      const types = await prisma.equipment.groupBy({
        by: ['type'],
        _count: true,
      });

      res.json({
        total,
        online,
        offline,
        error,
        maintenance,
        healthPercentage: total > 0 ? parseFloat(((online / total) * 100).toFixed(1)) : 0,
        byType: types.map((t) => ({ type: t.type, count: t._count })),
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
}

module.exports = createEquipmentRouter;
