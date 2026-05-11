// src/routes/bookingRoutes.js
// Tất cả booking routes đều yêu cầu đăng nhập

const express = require('express');
const router = express.Router();

const {
    createBooking,
    getAvailablePTs,
    getPTServices,
} = require('../controllers/bookingController');
const verifySession = require('../middlewares/verifySession');

// Lấy danh sách PT đang available
router.get('/available-pts', verifySession, getAvailablePTs);

// Lấy danh sách gói dịch vụ PT
router.get('/pt-services', verifySession, getPTServices);

// Tạo booking mới
router.post('/', verifySession, createBooking);

module.exports = router;