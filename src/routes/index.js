// src/routes/index.js
// File trung tâm quản lý tất cả routes
// Khi thêm route mới: chỉ cần import và đăng ký ở đây
// Không cần động vào app.js

const express = require('express');
const router = express.Router();

// ── Import các route theo từng tính năng ─────────────────
const authRoutes = require('./authRoutes');
const bookingRoutes = require('./bookingRoutes'); // mở khoá khi làm tính năng đặt lịch
// const ptRoutes    = require('./ptRoutes');        // mở khoá khi làm tính năng PT
// const adminRoutes = require('./adminRoutes');     // mở khoá khi làm tính năng admin

// ── Đăng ký routes ───────────────────────────────────────
router.use('/auth', authRoutes);
router.use('/bookings', bookingRoutes);
// router.use('/pts',      ptRoutes);
// router.use('/admin',    adminRoutes);

module.exports = router;