const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/scholarship.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const { permit } = require('../middlewares/role.middleware');

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);

// protected endpoints
router.post('/', authMiddleware, permit(['ADMIN','SUPER_ADMIN']), ctrl.create);
router.put('/:id', authMiddleware, permit(['ADMIN','SUPER_ADMIN']), ctrl.update);
router.post('/:id/publish', authMiddleware, permit(['ADMIN','SUPER_ADMIN']), ctrl.publish);
router.post('/:id/close', authMiddleware, permit(['ADMIN','SUPER_ADMIN']), ctrl.close);

module.exports = router;
