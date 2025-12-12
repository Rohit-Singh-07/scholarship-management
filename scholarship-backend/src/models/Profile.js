// src/models/Profile.js
const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  institution: String,
  degree: String,
  fieldOfStudy: String,
  startYear: Number,
  endYear: Number,
  grade: String,
}, { _id: false });

const addressSchema = new mongoose.Schema({
  line1: String,
  line2: String,
  city: String,
  state: String,
  country: String,
  postalCode: String
}, { _id: false });

const profileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
  dob: { type: Date },
  gender: { type: String },
  address: addressSchema,
  education: [educationSchema],
  family: {
    fatherName: String,
    motherName: String,
    annualIncome: { type: Number, default: 0 }
  },
  extra: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

// simple text index for quick lookup by name fields inside extra (if used)
profileSchema.index({ 'extra.search': 'text' });

module.exports = mongoose.model('Profile', profileSchema);
