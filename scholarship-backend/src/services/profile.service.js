// src/services/profile.service.js
const Profile = require('../models/Profile');
const User = require('../models/User');

async function createOrUpdateProfile(userId, payload) {
  // ensure the user exists
  const user = await User.findById(userId);
  if (!user) {
    const e = new Error('User not found');
    e.status = 404;
    throw e;
  }

  const upsert = {
    ...payload,
    user: userId,
  };

  const profile = await Profile.findOneAndUpdate(
    { user: userId },
    { $set: upsert },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return profile;
}

async function getProfileByUserId(userId) {
  return Profile.findOne({ user: userId }).lean();
}

async function getProfileById(profileId) {
  return Profile.findById(profileId).populate('user', 'name email role').lean();
}

module.exports = {
  createOrUpdateProfile,
  getProfileByUserId,
  getProfileById
};
