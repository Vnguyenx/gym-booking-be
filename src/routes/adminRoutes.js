// routes/adminRoutes.js
const express = require('express');
const router = express.Router();

const verifySession = require('../middlewares/verifySession');
const requireRole = require('../middlewares/requireRole');
const { updateUserRole, createClass } = require('../controllers/adminController');

// Tất cả routes /api/admin/* chỉ dành cho admin
router.use(verifySession);
router.use(requireRole('admin'));

// ── User management ───────────────────────────────────────
router.patch('/users/:uid/role', updateUserRole);

// ── Class management ─────────────────────────────────────
router.post('/classes', createClass);

module.exports = router;