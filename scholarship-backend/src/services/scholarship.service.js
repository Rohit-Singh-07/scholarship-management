const Scholarship = require('../models/Scholarship');

async function createScholarship(payload, userId) {
  const doc = new Scholarship({
    ...payload,
    createdBy: userId
  });
  await doc.save();
  return doc;
}

async function updateScholarship(id, payload, userId) {
  const sch = await Scholarship.findById(id);
  if (!sch) {
    const e = new Error('Scholarship not found');
    e.status = 404;
    throw e;
  }

  Object.assign(sch, payload);
  await sch.save();
  return sch;
}

async function getScholarship(id) {
  return Scholarship.findById(id).lean();
}

async function listScholarships({ page = 1, limit = 20, q, status }) {
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.$text = { $search: q }; // requires text index if used

  const skip = (page - 1) * limit;
  const docs = await Scholarship.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
  const total = await Scholarship.countDocuments(filter);
  return { docs, total, page, limit };
}

async function publishScholarship(id, userId) {
  const sch = await Scholarship.findById(id);
  if (!sch) {
    const e = new Error('Scholarship not found');
    e.status = 404;
    throw e;
  }
  sch.status = 'PUBLISHED';
  await sch.save();
  return sch;
}

async function closeScholarship(id, userId) {
  const sch = await Scholarship.findById(id);
  if (!sch) {
    const e = new Error('Scholarship not found');
    e.status = 404;
    throw e;
  }
  sch.status = 'CLOSED';
  await sch.save();
  return sch;
}

module.exports = {
  createScholarship,
  updateScholarship,
  getScholarship,
  listScholarships,
  publishScholarship,
  closeScholarship
};
