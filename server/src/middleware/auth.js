const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

function adminOnly(req, res, next) {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

function doctorOrAdmin(req, res, next) {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'DOCTOR') {
    return res.status(403).json({ error: 'Doctor or Admin access required.' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly, doctorOrAdmin };
