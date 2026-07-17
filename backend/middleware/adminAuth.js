const jwt = require('jsonwebtoken');

// Shared guard for admin-only routes - verifies the JWT issued at login
// (Authorization: Bearer <token>, see routes/adminAuth.js POST /login).
module.exports = function requireAdmin(req, res, next) {
  const header = req.header('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  try {
    req.adminId = jwt.verify(token, process.env.JWT_SECRET).adminId;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
};
