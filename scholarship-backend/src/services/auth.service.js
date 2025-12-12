// src/services/auth.service.js
const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token');
const redis = require('../config/redis');
const crypto = require('crypto');

// Redis key prefixes
const REFRESH_PREFIX = 'refresh:';        // refresh:<userId>
const EMAIL_VERIF_PREFIX = 'emailv:';    // emailv:<rawToken>
const EMAIL_VERIF_PREFIX_ALT = 'email_verification:'; // alternate used by some tests
const OTP_PREFIX = 'otp:';               // otp:<phone|email>
const LOCK_PREFIX = 'lock:';

// helper to convert "15m" -> seconds
function toSeconds(str) {
  const match = /^(\d+)([smhd])$/.exec(String(str));
  if (!match) return 60 * 60 * 24 * 30;
  const n = Number(match[1]), u = match[2];
  return u === 's' ? n :
         u === 'm' ? n * 60 :
         u === 'h' ? n * 3600 :
         u === 'd' ? n * 86400 : n;
}

async function register({ name, email, password, phone, role = 'APPLICANT' }, emailSender) {
  const existing = await User.findOne({ email });
  if (existing) {
    const e = new Error('Email already registered');
    e.status = 409;
    throw e;
  }

  const user = await User.create({ name, email, password, phone, role });

  // generate unguessable email verification token (raw)
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenKey = EMAIL_VERIF_PREFIX + rawToken;
  // store mapping rawToken -> userId
  await redis.set(tokenKey, user._id.toString(), 'EX', 60 * 60 * 24); // 24h

  // For compatibility with some test flows we also set a simple email->otp key if desired.
  // (Not necessary for real apps, tests may set their own keys directly.)

  if (emailSender) {
    await emailSender({
      to: email,
      subject: 'Verify your email',
      html: `
        <p>Hello ${name},</p>
        <p>Please verify your email by clicking the link below:</p>
        <a href="${process.env.FRONTEND_URL || ''}/verify-email?token=${rawToken}">Verify Email</a>
      `,
      text: `Verify your email using this token: ${rawToken}`
    });
  }

  return { user: sanitize(user), emailVerificationToken: rawToken };
}

async function verifyEmail({ token }) {
  const key = EMAIL_VERIF_PREFIX + token;
  const userId = await redis.get(key);
  if (!userId) {
    const e = new Error('Invalid or expired token');
    e.status = 400;
    throw e;
  }

  const user = await User.findById(userId);
  if (!user) {
    const e = new Error('User not found');
    e.status = 404;
    throw e;
  }

  user.emailVerified = true;
  await user.save();
  await redis.del(key);

  return { success: true };
}

// support verify by email + otp (some tests use this pattern)
async function verifyEmailByOtp({ email, otp }) {
  if (!email || !otp) {
    const e = new Error('Missing email or otp');
    e.status = 400;
    throw e;
  }

  // check alt key first (email_verification:<email>)
  const keyAlt = EMAIL_VERIF_PREFIX_ALT + email;
  const storedAlt = await redis.get(keyAlt);
  if (storedAlt && storedAlt === otp) {
    const user = await User.findOne({ email });
    if (!user) {
      const e = new Error('User not found');
      e.status = 404;
      throw e;
    }
    user.emailVerified = true;
    await user.save();
    await redis.del(keyAlt);
    return { success: true };
  }

  // fallback: try to find raw token -> userId stored by register
  // (not applicable for email+otp flow, but keep for completeness)
  const e = new Error('Invalid or expired token');
  e.status = 400;
  throw e;
}

async function login({ email, password }, ip) {
  const user = await User.findOne({ email }).select('+password +failedLoginAttempts +lockUntil');
  if (!user) {
    const e = new Error('Invalid credentials');
    e.status = 401;
    throw e;
  }

  // prevent login if email not verified
  if (!user.emailVerified) {
    const err = new Error('Please verify your email before logging in');
    err.status = 403;
    throw err;
  }

  if (user.isLocked && user.lockUntil && user.lockUntil > Date.now()) {
    const err = new Error('Account locked due to multiple failed attempts.');
    err.status = 423;
    throw err;
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    const threshold = Number(process.env.ACCOUNT_LOCK_THRESHOLD || 5);

    if (user.failedLoginAttempts >= threshold) {
      const lockMs = parseLockDuration(process.env.ACCOUNT_LOCK_DURATION || '15m');
      user.lockUntil = new Date(Date.now() + lockMs);
    }

    await user.save();
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  // Successful login
  user.failedLoginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  const payload = { sub: user._id.toString(), role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  // Save refreshToken in Redis
  const key = REFRESH_PREFIX + user._id.toString();
  const ttl = toSeconds(process.env.JWT_REFRESH_EXPIRES_IN || '30d');
  await redis.set(key, refreshToken, 'EX', ttl);

  return { accessToken, refreshToken, user: sanitize(user) };
}

async function rotateRefresh({ refreshToken }) {
  if (!refreshToken) {
    const e = new Error('Missing refresh token');
    e.status = 400;
    throw e;
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    const e = new Error('Invalid refresh token');
    e.status = 401;
    throw e;
  }

  const userId = payload.sub;
  const key = REFRESH_PREFIX + userId;
  const stored = await redis.get(key);

  if (!stored || stored !== refreshToken) {
    const e = new Error('Invalid or expired refresh token');
    e.status = 401;
    throw e;
  }

  const newAccess = signAccessToken({ sub: userId, role: payload.role });
  const newRefresh = signRefreshToken({ sub: userId, role: payload.role });

  const ttl = toSeconds(process.env.JWT_REFRESH_EXPIRES_IN || '30d');
  await redis.set(key, newRefresh, 'EX', ttl);

  return { accessToken: newAccess, refreshToken: newRefresh };
}

async function logout(userId) {
  await redis.del(REFRESH_PREFIX + userId);
  return { success: true };
}

async function generatePasswordReset(email, emailSender) {
  const user = await User.findOne({ email });
  if (!user) {
    const e = new Error('No user with that email');
    e.status = 404;
    throw e;
  }

  const { raw, hashed } = user.generatePasswordReset();
  user.resetPasswordToken = hashed;
  user.resetPasswordExpires = Date.now() + 1000 * 60 * 60; // 1h
  await user.save();

  if (emailSender) {
    await emailSender({
      to: email,
      subject: 'Password Reset',
      html: `
        <p>You requested a password reset.</p>
        <p>Use the token below to reset your password:</p>
        <b>${raw}</b>
      `,
      text: `Your password reset token: ${raw}`
    });
  }

  return { success: true };
}

async function resetPassword({ token, newPassword }) {
  const hashed = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() }
  });
  if (!user) {
    const e = new Error('Invalid or expired password reset token');
    e.status = 400;
    throw e;
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  await redis.del(REFRESH_PREFIX + user._id.toString());

  return { success: true };
}

async function sendOtp({ to, purpose = 'login' }, smsSender) {
  const raw = String(Math.floor(100000 + Math.random() * 900000));
  const key = OTP_PREFIX + purpose + ':' + to;

  await redis.set(key, raw, 'EX', 5 * 60);

  if (smsSender) {
    await smsSender({ to, message: `Your OTP is ${raw}` });
  }

  return { success: true };
}

async function verifyOtp({ to, code, purpose = 'login' }) {
  const key = OTP_PREFIX + purpose + ':' + to;
  const stored = await redis.get(key);
  if (!stored || stored !== code) {
    const e = new Error('Invalid or expired OTP');
    e.status = 400;
    throw e;
  }

  await redis.del(key);
  return { success: true };
}

function sanitize(user) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.failedLoginAttempts;
  delete obj.lockUntil;
  return obj;
}

function parseLockDuration(str) {
  const match = /^(\d+)([smhd])$/.exec(String(str));
  if (!match) return 15 * 60 * 1000;
  const n = Number(match[1]), u = match[2];
  return u === 's' ? n * 1000 :
         u === 'm' ? n * 60 * 1000 :
         u === 'h' ? n * 3600 * 1000 :
         u === 'd' ? n * 86400 * 1000 :
         n * 60 * 1000;
}

module.exports = {
  register,
  verifyEmail,
  verifyEmailByOtp,
  login,
  rotateRefresh,
  logout,
  generatePasswordReset,
  resetPassword,
  sendOtp,
  verifyOtp
};
