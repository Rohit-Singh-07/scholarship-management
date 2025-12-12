// src/middlewares/rateLimit.middleware.js
const rateLimit = require('express-rate-limit');

// Global basic API rate limiter (apply in app.js)
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders: false,
});

// Login-specific limiter (per-IP)
const rateLimiterForLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts from this IP, try later.' }
});

module.exports = { apiLimiter, rateLimiterForLogin };
