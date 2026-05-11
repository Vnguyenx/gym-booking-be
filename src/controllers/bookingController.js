// src/controllers/bookingController.js
// Nhận request → gọi service → trả response
// Không chứa logic nghiệp vụ

const bookingService = require('../services/bookingService');

// POST /api/bookings — Tạo booking mới
const createBooking = async (req, res) => {
    try {
        // customerId lấy từ session cookie — không tin FE
        const result = await bookingService.createBooking(req.user.uid, req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error('Lỗi tạo booking:', err);
        res.status(500).json({ error: err.message });
    }
};

// GET /api/bookings/available-pts — Lấy PT đang trống lịch
const getAvailablePTs = async (req, res) => {
    try {
        const pts = await bookingService.getAvailablePTs();
        res.json({ pts });
    } catch (err) {
        console.error('Lỗi lấy danh sách PT:', err);
        res.status(500).json({ error: err.message });
    }
};

// GET /api/bookings/pt-services — Lấy gói dịch vụ PT
const getPTServices = async (req, res) => {
    try {
        const ptServices = await bookingService.getPTServices();
        res.json({ ptServices });
    } catch (err) {
        console.error('Lỗi lấy PT services:', err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = { createBooking, getAvailablePTs, getPTServices };