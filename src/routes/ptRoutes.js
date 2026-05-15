// routes/ptRoutes.js
const express = require('express');
const router = express.Router();

const verifySession = require('../middlewares/verifySession');
const requireRole = require('../middlewares/requireRole');
const {
    getActiveStudents,
    getExpiredStudents,
    confirmAttendance,
    updateProfile,
} = require('../controllers/ptController');

// Tất cả routes /api/pt/* đều yêu cầu đăng nhập + role PT
router.use(verifySession);
router.use(requireRole('pt', 'admin')); // admin cũng được xem, tiện debug

// ── Student management ────────────────────────────────────
router.get('/students', getActiveStudents);
router.get('/students/history', getExpiredStudents);

// ── Attendance confirmation ───────────────────────────────
router.post('/confirm/:attendanceId', confirmAttendance);

// ── PT profile ────────────────────────────────────────────
router.put('/profile', updateProfile);

module.exports = router;