// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { rateLimiterForLogin } = require('../middlewares/rateLimit.middleware');

// Public
router.post('/register', ctrl.register);
router.post('/verify-email', ctrl.verifyEmail);
router.post('/login', rateLimiterForLogin, ctrl.login);
router.post('/refresh', ctrl.rotate);

// Support both route names used in various places/tests:
router.post('/request-password-reset', ctrl.requestPasswordReset);
router.post('/request-reset', ctrl.requestPasswordReset);

router.post('/reset-password', ctrl.resetPassword);
router.post('/send-otp', ctrl.sendOtp);
router.post('/verify-otp', ctrl.verifyOtp);

// Protected
router.post('/logout', authMiddleware, ctrl.logout);

module.exports = router;
