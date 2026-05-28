// src/routes/bookingRoutes.js
// Tất cả booking routes đều yêu cầu đăng nhập

const express = require('express');
const router = express.Router();

const {
    createBooking,
    createBookingQR,
    getAvailablePTs,
    getPTServices,
    vnpayIPN,
} = require('../controllers/bookingController');
const verifySession = require('../middlewares/verifySession');

// Lấy danh sách PT đang available
router.get('/available-pts', verifySession, getAvailablePTs);

// Lấy danh sách gói dịch vụ PT
router.get('/pt-services', verifySession, getPTServices);

// Tạo booking mới — thanh toán VNPay
router.post('/', verifySession, createBooking);

// Tạo booking mới — thanh toán QR chuyển khoản
// Trả về { bookingId, qrUrl, paymentCode, totalPrice, accountNo, accountName, bankId }
router.post('/qr', verifySession, createBookingQR);

/**
 * Route nhận thông báo kết quả từ VNPay (IPN)
 * QUAN TRỌNG: Không dùng verifySession ở đây
 * VNPay gọi bằng phương thức GET
 */
router.get('/vnpay-ipn', vnpayIPN);

module.exports = router;