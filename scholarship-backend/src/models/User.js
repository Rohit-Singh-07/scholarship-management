// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const ROLES = ['APPLICANT', 'REVIEWER', 'ADMIN', 'SUPER_ADMIN'];

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },

  // unique already creates an index → no need for index: true or schema.index()
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },

  password: { type: String, required: true, select: false },
  role: { type: String, enum: ROLES, default: 'APPLICANT' },
  phone: { type: String },
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  failedLoginAttempts: { type: Number, default: 0, select: false },
  lockUntil: { type: Date, select: false },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpires: { type: Date, select: false },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });


// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});


// Compare password
userSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Account lock helpers
userSchema.methods.incFailedAttempts = function() {
  this.failedLoginAttempts += 1;
  return this.save();
};

userSchema.methods.resetFailedAttempts = function() {
  this.failedLoginAttempts = 0;
  this.lockUntil = null;
  return this.save();
};

userSchema.methods.lockAccount = function(durationMs) {
  this.lockUntil = new Date(Date.now() + durationMs);
  return this.save();
};

userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

// Reset token generator
userSchema.methods.generatePasswordReset = function() {
  const raw = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(raw).digest('hex');
  this.resetPasswordExpires = Date.now() + 1000 * 60 * 60; // 1 hour
  return { raw, hashed: this.resetPasswordToken };
};

userSchema.statics.ROLES = ROLES;

module.exports = mongoose.model('User', userSchema);
