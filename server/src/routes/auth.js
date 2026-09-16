const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../middleware/auth');

function createAuthRouter(prisma) {
  const router = express.Router();

  // POST /api/auth/login
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is disabled' });
      }

      const token = jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          phone: user.phone,
        },
      });
    } catch (err) {
      console.error('[Auth] Login error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  // GET /api/auth/me
  router.get('/me', authMiddleware, async (req, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, name: true, email: true, role: true, department: true, phone: true, isActive: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // PUT /api/auth/profile - Update current user profile
  router.put('/profile', authMiddleware, async (req, res) => {
    try {
      const { name, department, phone, currentPassword, newPassword } = req.body;
      const updateData = {};

      if (name && name.trim()) updateData.name = name.trim();
      if (department !== undefined) updateData.department = department.trim();
      if (phone !== undefined) updateData.phone = phone.trim();

      // If user wants to change password
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: 'Current password is required to set a new password' });
        }
        if (newPassword.length < 6) {
          return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        const currentUser = await prisma.user.findUnique({ where: { id: req.user.id } });
        const validPassword = await bcrypt.compare(currentPassword, currentUser.password);
        if (!validPassword) {
          return res.status(401).json({ error: 'Current password does not match' });
        }

        updateData.password = await bcrypt.hash(newPassword, 10);
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: updateData,
        select: { id: true, name: true, email: true, role: true, department: true, phone: true, isActive: true },
      });

      res.json(updatedUser);
    } catch (err) {
      console.error('[Auth] Profile update error:', err);
      res.status(500).json({ error: err.message || 'Server error updating profile' });
    }
  });

  // POST /api/auth/register (admin only)
  router.post('/register', authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { name, email, password, role, department, phone } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required' });
      }

      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role || 'NURSE',
          department: department || 'General',
          phone: phone || '',
        },
      });

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      });
    } catch (err) {
      console.error('[Auth] Register error:', err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
}

module.exports = createAuthRouter;
