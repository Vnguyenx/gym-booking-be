// src/services/bookingService.js
// Chứa toàn bộ logic nghiệp vụ của booking
// Controller chỉ gọi vào đây, không chứa logic

const { admin, db } = require('../config/firebase');
const { generateQR } = require('../utils/vietqr');
const crypto = require('crypto');
const qs = require('qs');
const { generateVnpayUrl, sortObject } = require('../utils/vnpay');

/**
 * Lấy thông tin tài khoản ngân hàng từ Firestore
 * Collection: gym_settings / Document: payment
 */
const getPaymentConfig = async () => {
    const doc = await db.collection('gym_settings').doc('payment').get();
    if (!doc.exists) throw new Error('Chưa cấu hình thông tin thanh toán');
    return doc.data();
};

/**
 * Sinh mã đối chiếu thanh toán duy nhất
 * Format: GYM-YYYYMMDD-XXXXX (ví dụ: GYM-20260507-A3K9P)
 */
const generatePaymentCode = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `GYM-${date}-${random}`;
};

/**
 * Tính tổng tiền từ Firestore — không dùng giá FE gửi lên
 * Tránh trường hợp user tự sửa giá trong request
 */
const calcTotalPrice = async (membershipId, ptServiceId) => {
    const [membershipDoc, ptServiceDoc] = await Promise.all([
        db.collection('memberships').doc(membershipId).get(),
        db.collection('pt_services').doc(ptServiceId).get(),
    ]);

    if (!membershipDoc.exists) throw new Error('Gói tập không tồn tại');
    if (!ptServiceDoc.exists) throw new Error('Dịch vụ PT không tồn tại');

    const membership = membershipDoc.data();
    const ptService = ptServiceDoc.data();

    const membershipPrice = membership.priceOnline;
    const ptPrice = ptService.pricePerMonth * membership.durationMonths;

    return {
        totalPrice: membershipPrice + ptPrice,
        membership,
        ptService,
    };
};

/**
 * Tạo booking mới — thanh toán qua VNPay
 * @param {string} customerId - uid của khách hàng (lấy từ session)
 * @param {object} body - { membershipId, ptServiceId, ptId }
 */
const createBooking = async (req, customerId, body) => {
    const { membershipId, ptServiceId, ptId } = body;

    const priceData = await calcTotalPrice(membershipId, ptServiceId);

    const bookingRef = await db.collection('bookings').add({
        customerId,
        membershipId,
        ptServiceId,
        ptId: ptId || '',
        totalPrice: priceData.totalPrice,
        status: 'pending',
        paymentMethod: 'vnpay',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const paymentUrl = generateVnpayUrl(req, priceData.totalPrice, bookingRef.id);

    return {
        bookingId: bookingRef.id,
        paymentUrl,
        totalPrice: priceData.totalPrice,
    };
};

/**
 * Tạo booking mới — thanh toán qua QR chuyển khoản (VietQR)
 * Không redirect sang cổng thanh toán, trả về QR URL để FE hiển thị modal.
 * Admin xác nhận thủ công sau khi kiểm tra tài khoản.
 *
 * @param {string} customerId - uid của khách hàng (lấy từ session)
 * @param {object} body - { membershipId, ptServiceId, ptId }
 * @returns {{ bookingId, qrUrl, paymentCode, totalPrice }}
 */
const createBookingQR = async (customerId, body) => {
    const { membershipId, ptServiceId, ptId } = body;

    // 1. Tính tiền từ DB (giống VNPay — không tin giá FE)
    const priceData = await calcTotalPrice(membershipId, ptServiceId);

    // 2. Lấy thông tin tài khoản ngân hàng từ gym_settings
    const paymentConfig = await getPaymentConfig();
    const { bankId, accountNo, accountName } = paymentConfig;

    // 3. Sinh mã đối chiếu duy nhất
    const paymentCode = generatePaymentCode();

    // 4. Lưu booking với status 'pending_manual' — chờ admin xác nhận
    const bookingRef = await db.collection('bookings').add({
        customerId,
        membershipId,
        ptServiceId,
        ptId: ptId || '',
        totalPrice: priceData.totalPrice,
        status: 'pending_manual',   // khác với VNPay ('pending')
        paymentMethod: 'qr',
        paymentCode,                // mã đối chiếu để admin kiểm tra
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 5. Tạo URL ảnh QR từ VietQR
    const qrUrl = generateQR({
        bankId,
        accountNo,
        accountName,
        amount: priceData.totalPrice,
        paymentCode,
    });

    return {
        bookingId: bookingRef.id,
        qrUrl,
        paymentCode,
        totalPrice: priceData.totalPrice,
        accountNo,
        accountName,
        bankId,
    };
};

/**
 * Lấy danh sách PT đang trống lịch
 */
const getAvailablePTs = async () => {
    const snapshot = await db.collection('pts')
        .where('isAvailable', '==', true)
        .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Lấy danh sách gói dịch vụ PT
 */
const getPTServices = async () => {
    const snapshot = await db.collection('pt_services').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Xử lý logic IPN từ VNPay
 */
const processVnpayIPN = async (vnp_Params) => {
    const secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];
    const sortedParams = sortObject(vnp_Params);

    const secretKey = process.env.VNP_HASHSECRET;
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    if (secureHash !== signed) {
        return { success: false, code: '97', message: 'Invalid Checksum' };
    }

    const bookingId = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];

    if (responseCode === '00') {
        const bookingDoc = await db.collection('bookings').doc(bookingId).get();
        if (!bookingDoc.exists) return { success: false, code: '01', message: 'Booking not found' };
        const booking = bookingDoc.data();

        const membershipDoc = await db.collection('memberships').doc(booking.membershipId).get();
        const membership = membershipDoc.data();
        const durationMonths = membership.durationMonths;

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + durationMonths);

        const totalSessions = durationMonths * 16;

        await db.collection('classes').add({
            type: booking.ptServiceId,
            classGroupId: '',
            status: 'active',
            startDate: admin.firestore.Timestamp.fromDate(startDate),
            endDate: admin.firestore.Timestamp.fromDate(endDate),
            totalSessions,
            usedSessions: 0,
            customerId: booking.customerId,
            ptId: booking.ptId || '',
            createdBy: 'system',
            creatorRole: 'system',
            bookingId,
        });

        await db.collection('bookings').doc(bookingId).update({
            status: 'confirmed',
            paidAt: admin.firestore.FieldValue.serverTimestamp(),
            vnpay_TransactionNo: vnp_Params['vnp_TransactionNo'],
        });

        return { success: true, code: '00', message: 'Confirm Success' };
    } else {
        await db.collection('bookings').doc(bookingId).update({
            status: 'cancelled',
            cancelReason: 'VNPay payment failed',
            vnpay_ResponseCode: responseCode,
            vnpay_TransactionNo: vnp_Params['vnp_TransactionNo'] || '',
        });
        return { success: false, code: '01', message: 'Payment Failed' };
    }
};

module.exports = {
    createBooking,
    createBookingQR,
    getAvailablePTs,
    getPTServices,
    processVnpayIPN,
};