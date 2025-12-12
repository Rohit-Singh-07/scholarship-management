// src/middlewares/emailRateLimiter.js
const redis = require('../config/redis');

/**
 * limitByRecipient(options)
 * options: { windowSeconds, max }
 * Limits sends per recipient (email) using redis INCR+EX
 */
function limitByRecipient({ windowSeconds = 3600, max = 5 } = {}) {
  return async (req, res, next) => {
    try {
      const to = (req.body && (req.body.email || req.body.to)) || (req.query && req.query.to);
      if (!to) return res.status(400).json({ success: false, message: 'Missing "to" email' });

      const key = `email:rate:${to}:${Math.floor(Date.now()/1000/windowSeconds)}`;
      const current = await redis.incr(key);
      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }
      if (current > max) {
        return res.status(429).json({ success: false, message: 'Too many email requests for this recipient. Try later.' });
      }
      next();
    } catch (err) {
      console.error('[emailRateLimiter] error', err);
      // fail-open: don't block on redis failure
      next();
    }
  };
}

module.exports = { limitByRecipient };
