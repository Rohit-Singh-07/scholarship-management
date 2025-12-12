// src/middlewares/auth.middleware.js
const { verifyAccessToken } = require('../utils/token');
const authService = require('../services/auth.service');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing token' });
    }
    const token = authHeader.split(' ')[1];
    const payload = verifyAccessToken(token);
    req.userId = payload.sub;
    req.userRole = payload.role;

    // Optionally attach full user
    const user = await authService.findById ? await authService.findById(payload.sub) : null;
    if (user && !user.isActive) return res.status(403).json({ success: false, message: 'Account disabled' });

    req.user = user || null;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

module.exports = { authMiddleware };
