// src/middlewares/role.middleware.js
function roleMiddleware(allowed = []) {
  return (req, res, next) => {
    const role = req.userRole || (req.user && req.user.role);
    if (!role) return res.status(403).json({ success: false, message: 'Role missing' });
    if (!allowed.includes(role)) return res.status(403).json({ success: false, message: 'Forbidden' });
    next();
  };
}

module.exports = { roleMiddleware };
