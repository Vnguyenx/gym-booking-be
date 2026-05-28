// src/controllers/bookingController.js
// Nhận request → gọi service → trả response
// Không chứa logic nghiệp vụ

const bookingService = require('../services/bookingService');

/**
 * IPN handler: Nhận thông báo từ VNPay
 * GET /api/bookings/vnpay-ipn
 */
const vnpayIPN = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const result = await bookingService.processVnpayIPN(vnp_Params);
        res.status(200).json({ RspCode: result.code, Message: result.message });
    } catch (err) {
        console.error('IPN Controller Error:', err);
        res.status(200).json({ RspCode: '99', Message: 'Unknown Error' });
    }
};

// POST /api/bookings — Tạo booking mới (VNPay)
const createBooking = async (req, res) => {
    try {
        const result = await bookingService.createBooking(req, req.user.uid, req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error('Lỗi tạo booking:', err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/bookings/qr — Tạo booking thanh toán QR
 * Trả về qrUrl, paymentCode để FE hiển thị modal.
 * Booking được lưu với status 'pending_manual', admin xác nhận thủ công.
 */
const createBookingQR = async (req, res) => {
    try {
        const result = await bookingService.createBookingQR(req.user.uid, req.body);
        res.status(201).json(result);
    } catch (err) {
        console.error('Lỗi tạo booking QR:', err);
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

module.exports = { createBooking, createBookingQR, getAvailablePTs, getPTServices, vnpayIPN };