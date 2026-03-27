// src/app.js
// Cấu hình Express app — đăng ký middleware và routes
// Tách riêng khỏi server.js để dễ test và bảo trì

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ── Middleware ──────────────────────────────────────────
// Cho phép FE (localhost:3000) gọi API sang BE (localhost:5000)
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
}));

// Cho phép đọc JSON từ request body
app.use(express.json());

// ── Routes ──────────────────────────────────────────────
// Route kiểm tra server có chạy không
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server đang hoạt động bình thường',
    });
});

// ── Xử lý route không tồn tại ───────────────────────────
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Đường dẫn không tồn tại',
    });
});

module.exports = app;