// src/routes/authRoutes.js
// Định nghĩa các endpoint liên quan đến xác thực người dùng
// Mỗi route gắn với 1 hàm xử lý (controller) tương ứng

const express = require('express');
const router = express.Router();

const { register, login, logout, getMe } = require('../controllers/authController');
const verifySession = require('../middlewares/verifySession');

// ── Public routes (không cần đăng nhập) ──────────────────

// Đăng ký tài khoản mới
router.post('/register', register);

// Đăng nhập — FE gửi idToken, BE trả về session cookie
router.post('/login', login);

// Đăng xuất — xóa session cookie
router.post('/logout', logout);

// ── Protected routes (phải đăng nhập mới dùng được) ──────

// Lấy thông tin user hiện tại — dùng khi F5 để khôi phục session
// verifySession chạy trước, nếu hợp lệ mới chạy getMe
router.get('/me', verifySession, getMe);

module.exports = router;