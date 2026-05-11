// src/services/bookingService.js
// Chứa toàn bộ logic nghiệp vụ của booking
// Controller chỉ gọi vào đây, không chứa logic

const { admin, db } = require('../config/firebase');
const { generateQR } = require('../utils/vietqr');

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
 * Tạo booking mới
 * @param {string} customerId - uid của khách hàng (lấy từ session)
 * @param {object} body - { membershipId, ptServiceId, ptId }
 */
const createBooking = async (customerId, { membershipId, ptServiceId, ptId }) => {
    // Kiểm tra booking pending cũ
    const existingSnapshot = await db.collection('bookings')
        .where('customerId', '==', customerId)
        .where('status', '==', 'pending')
        .limit(1)
        .get();

    if (!existingSnapshot.empty) {
        // Đã có booking pending → xoá đi tạo mới
        // Lý do: user có thể đổi gói, đổi PT → cần booking mới
        const existingDoc = existingSnapshot.docs[0];
        await existingDoc.ref.delete();
    }

    // Bước 1: Tính tổng tiền từ DB
    const { totalPrice } = await calcTotalPrice(membershipId, ptServiceId);

    // Bước 2: Sinh mã đối chiếu
    const paymentCode = generatePaymentCode();

    // Bước 3: Lấy thông tin ngân hàng
    const paymentConfig = await getPaymentConfig();

    // Bước 4: Tạo QR
    const qrImageUrl = generateQR({
        accountNo: paymentConfig.accountNo,
        accountName: paymentConfig.accountName,
        bankId: paymentConfig.bankId,
        amount: totalPrice,
        paymentCode,
    });

    // Bước 5: Lưu booking mới vào Firestore
    const bookingRef = await db.collection('bookings').add({
        customerId,
        membershipId,
        ptServiceId,
        ptId: ptId || '',
        totalPrice,
        status: 'pending',
        paymentCode,
        paidAt: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
        bookingId: bookingRef.id,
        paymentCode,
        qrImageUrl,
        totalPrice,
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

module.exports = {
    createBooking,
    getAvailablePTs,
    getPTServices,
};