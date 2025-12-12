// src/controllers/auth.controller.js
const authService = require('../services/auth.service');

// pluggable senders (implement elsewhere and inject)
const emailSender = require('../utils/emailSender'); // optional
const smsSender = require('../utils/smsSender');

async function register(req, res, next) {
  try {
    const data = await authService.register(req.body, emailSender);
    // Return message + user. In production remove the token from response.
    return res.status(201).json({
      success: true,
      message: 'Verification email sent',
      user: data.user,
      emailVerificationToken: data.emailVerificationToken // only for tests/dev
    });
  } catch (err) {
    return next(err);
  }
}

async function verifyEmail(req, res, next) {
  try {
    // support two shapes: { token } OR { email, otp }
    const { token, email, otp } = req.body;
    if (token) {
      await authService.verifyEmail({ token });
    } else if (email && otp) {
      await authService.verifyEmailByOtp({ email, otp });
    } else {
      const e = new Error('Missing token or email+otp');
      e.status = 400;
      throw e;
    }
    return res.json({ success: true, message: 'Email verified' });
  } catch (err) {
    return next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = await authService.login(req.body, req.ip);
    // adapt response to include `token` for tests as well as access/refresh
    return res.json({
      success: true,
      token: data.accessToken,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user
    });
  } catch (err) {
    return next(err);
  }
}

async function rotate(req, res, next) {
  try {
    const tokens = await authService.rotateRefresh({ refreshToken: req.body.refreshToken });
    return res.json({ success: true, ...tokens });
  } catch (err) {
    return next(err);
  }
}

async function logout(req, res, next) {
  try {
    const userId = req.userId;
    await authService.logout(userId);
    return res.json({ success: true, message: 'Logged out' });
  } catch (err) {
    return next(err);
  }
}

async function requestPasswordReset(req, res, next) {
  try {
    await authService.generatePasswordReset(req.body.email, emailSender);
    return res.json({ success: true, message: 'Reset code sent' });
  } catch (err) {
    return next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    await authService.resetPassword({ token: req.body.token, newPassword: req.body.password });
    return res.json({ success: true, message: 'Password reset' });
  } catch (err) {
    return next(err);
  }
}

async function sendOtp(req, res, next) {
  try {
    await authService.sendOtp({ to: req.body.to, purpose: req.body.purpose }, smsSender);
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    await authService.verifyOtp({ to: req.body.to, code: req.body.code, purpose: req.body.purpose });
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  register, verifyEmail, login, rotate, logout,
  requestPasswordReset, resetPassword, sendOtp, verifyOtp
};
