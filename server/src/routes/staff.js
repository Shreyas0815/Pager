const express = require('express');
const { authMiddleware, adminOnly } = require('../middleware/auth');

function createStaffRouter(prisma) {
  const router = express.Router();

  // GET /api/staff - List all staff
  router.get('/', authMiddleware, async (req, res) => {
    try {
      const { role } = req.query;
      const where = {};
      if (role) where.role = role;

      const staff = await prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true,
          department: true, phone: true, isActive: true,
          _count: { select: { assignments: true } },
        },
        orderBy: { name: 'asc' },
      });

      res.json(staff);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // POST /api/staff/assign - Assign staff to patient
  router.post('/assign', authMiddleware, async (req, res) => {
    try {
      const { staffId, patientId, role } = req.body;
      if (!staffId || !patientId || !role) {
        return res.status(400).json({ error: 'staffId, patientId, and role are required' });
      }

      const assignment = await prisma.staffAssignment.create({
        data: { staffId, patientId, role },
        include: {
          staff: { select: { id: true, name: true, role: true } },
          patient: { select: { id: true, name: true, bedNumber: true } },
        },
      });

      res.status(201).json(assignment);
    } catch (err) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: 'Staff already assigned to this patient' });
      }
      res.status(500).json({ error: 'Server error' });
    }
  });

  // GET /api/staff/notifications - Get notifications for current user
  router.get('/notifications', authMiddleware, async (req, res) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      res.json(notifications);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // POST /api/staff/notifications/:id/read - Mark notification as read
  router.post('/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
      const notification = await prisma.notification.update({
        where: { id: req.params.id },
        data: { read: true },
      });
      res.json(notification);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
}

module.exports = createStaffRouter;
