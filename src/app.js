// src/app.js
// Cấu hình Express app — đăng ký middleware và routes
// Tách riêng khỏi server.js để dễ test và bảo trì

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

require('dotenv').config();

const routes = require('./routes/index');

const app = express();

// ── Middleware ────────────────────────────────────────────

// Cho phép FE gọi API sang BE kèm cookie
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true, // bắt buộc để cookie hoạt động
}));

// Cho phép đọc JSON từ request body
app.use(express.json());

// Cho phép đọc cookie từ request
app.use(cookieParser());

// ── Routes ───────────────────────────────────────────────

// Kiểm tra server có chạy không
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Server đang hoạt động bình thường',
    });
});

// Tất cả routes đều đi qua đây
// Ví dụ: /api/auth/login, /api/auth/register...
app.use('/api', routes);

// ── Xử lý route không tồn tại ────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Đường dẫn không tồn tại',
    });
});

module.exports = app;