const scholarshipService = require('../services/scholarship.service');

async function create(req, res, next) {
  try {
    const userId = req.userId;
    const payload = req.body;
    const sch = await scholarshipService.createScholarship(payload, userId);
    return res.status(201).json({ success: true, message: 'Scholarship created', scholarship: sch });
  } catch (err) {
    return next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = req.params.id;
    const payload = req.body;
    const sch = await scholarshipService.updateScholarship(id, payload, req.userId);
    return res.json({ success: true, message: 'Scholarship updated', scholarship: sch });
  } catch (err) {
    return next(err);
  }
}

async function getOne(req, res, next) {
  try {
    const id = req.params.id;
    const sch = await scholarshipService.getScholarship(id);
    if (!sch) {
      const e = new Error('Scholarship not found');
      e.status = 404;
      throw e;
    }
    return res.json({ success: true, scholarship: sch });
  } catch (err) {
    return next(err);
  }
}

async function list(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const q = req.query.q;
    const status = req.query.status;
    const data = await scholarshipService.listScholarships({ page, limit, q, status });
    return res.json({ success: true, ...data });
  } catch (err) {
    return next(err);
  }
}

async function publish(req, res, next) {
  try {
    const id = req.params.id;
    const sch = await scholarshipService.publishScholarship(id, req.userId);
    return res.json({ success: true, message: 'Scholarship published', scholarship: sch });
  } catch (err) {
    return next(err);
  }
}

async function close(req, res, next) {
  try {
    const id = req.params.id;
    const sch = await scholarshipService.closeScholarship(id, req.userId);
    return res.json({ success: true, message: 'Scholarship closed', scholarship: sch });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  create, update, getOne, list, publish, close
};
