// src/controllers/adminBookingController.js
//
// Quản lý collection: bookings

const { admin, auth, db } = require('../../config/firebase');

const convertTimestamps = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
        result[key] = val?.toDate ? val.toDate().toISOString() : val;
    }
    return result;
};

/**
 * GET /api/admin/bookings?status=pending|confirmed|cancelled
 * Cập nhật để join tên khách, tên gói và tên PT cho cả danh sách
 */
const getBookings = async (req, res) => {
    try {
        const { status } = req.query;
        let query = db.collection('bookings').orderBy('createdAt', 'desc');

        if (status && status !== 'all') {
            query = db.collection('bookings')
                .where('status', '==', status)
                .orderBy('createdAt', 'desc');
        }

        const snap = await query.get();

        // Dùng Promise.all để fetch thông tin bổ trợ cho tất cả booking cùng lúc
        const bookings = await Promise.all(snap.docs.map(async (doc) => {
            const data = doc.data();

            // 1. Lấy tên khách hàng
            const userDoc = await db.collection('users').doc(data.customerId).get();
            const customerName = userDoc.exists ? (userDoc.data().displayName || userDoc.data().fullName) : 'Nguời dùng';
            const customerPhone = userDoc.exists ? userDoc.data().phoneNumber : '';

            // 2. Lấy tên gói tập
            const memDoc = await db.collection('memberships').doc(data.membershipId).get();
            const membershipName = memDoc.exists ? memDoc.data().name : data.membershipId;

            // 3. Lấy tên PT (nếu có)
            let ptName = '';
            if (data.ptId) {
                const ptDoc = await db.collection('pts').doc(data.ptId).get();
                ptName = ptDoc.exists ? ptDoc.data().fullName : '';
            }

            // 4. Lấy tên dịch vụ PT
            const ptServiceNames = {
                'pt-none': 'Không thuê PT',
                'pt-1on1': 'Thuê PT 1:1',
                'pt-group': 'Thuê PT nhóm'
            };

            return {
                id: doc.id,
                ...convertTimestamps(data),
                customerName,
                customerPhone,
                membershipName,
                ptName,
                ptServiceName: ptServiceNames[data.ptServiceId] || data.ptServiceId
            };
        }));

        res.json({ bookings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/admin/bookings/:bookingId
 */
const getBookingById = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const doc = await db.collection('bookings').doc(bookingId).get();
        if (!doc.exists) return res.status(404).json({ error: 'Không tìm thấy đơn' });

        const bookingData = doc.data();

        // --- Bắt đầu phần Join dữ liệu ---
        // 1. Lấy tên khách hàng
        const userDoc = await db.collection('users').doc(bookingData.customerId).get();
        const customerName = userDoc.exists ? userDoc.data().displayName : 'N/A';
        const customerPhone = userDoc.exists ? userDoc.data().phone : 'N/A';

        // 2. Lấy tên gói tập
        const memDoc = await db.collection('memberships').doc(bookingData.membershipId).get();
        const membershipName = memDoc.exists ? memDoc.data().name : 'Gói tập đã xoá';

        // 3. Lấy tên dịch vụ PT (nếu có)
        let ptServiceName = 'Không thuê PT';
        if (bookingData.ptServiceId && bookingData.ptServiceId !== 'pt-none') {
            const ptServDoc = await db.collection('pt_services').doc(bookingData.ptServiceId).get();
            ptServiceName = ptServDoc.exists ? ptServDoc.data().name : bookingData.ptServiceId;
        }
        // 3. Lấy tên PT
        let ptName = 'Chưa chọn / Không có';
        if (bookingData.ptId && bookingData.ptId !== '') {
            const ptDoc = await db.collection('pts').doc(bookingData.ptId).get();
            ptName = ptDoc.exists ? ptDoc.data().fullName : 'PT không tồn tại';
        }
        const fullBooking = {
            id: doc.id,
            ...convertTimestamps(bookingData),
            customerName,   // <--- Thêm các trường này
            customerPhone,
            membershipName,
            ptServiceName,
            ptName
        };

        res.json({ booking: fullBooking });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * PATCH /api/admin/bookings/:bookingId
 * Duyệt hoặc huỷ đơn
 * Body: { status: 'confirmed' | 'cancelled' }
 *
 * Khi confirmed → tạo lớp học tương ứng trong collection classes
 */
const updateBookingStatus = async (req, res) => {
    const { bookingId } = req.params;
    const { status }    = req.body;

    if (!['confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({ error: 'status phải là confirmed hoặc cancelled' });
    }

    try {
        const bookingRef = db.collection('bookings').doc(bookingId);
        const bookingDoc = await bookingRef.get();
        if (!bookingDoc.exists) return res.status(404).json({ error: 'Không tìm thấy booking' });

        const update = { status };
        if (status === 'confirmed') update.paidAt = new Date().toISOString();

        await bookingRef.update(update);

        // Nếu confirmed + có ptId → tạo class luôn
        if (status === 'confirmed') {
            const data = bookingDoc.data();

            if (data.ptId && data.ptServiceId !== 'pt-none') {
                // Lấy thông tin membership để biết số buổi
                const memDoc = await db.collection('memberships').doc(data.membershipId).get();
                const durationMonths = memDoc.exists ? memDoc.data().durationMonths : 1;
                const totalSessions  = durationMonths * 8; // ước tính 8 buổi/tháng

                const startDate = new Date();
                const endDate   = new Date();
                endDate.setMonth(endDate.getMonth() + durationMonths);

                await db.collection('classes').add({
                    customerId:   data.customerId,
                    ptId:         data.ptId,
                    type:         data.ptServiceId === 'pt-1on1' ? 'pt-1on1' : 'pt-group',
                    totalSessions,
                    usedSessions: 0,
                    startDate,
                    endDate,
                    classGroupId: null,
                    status:       'active',
                    createdBy:    req.user.uid,
                    creatorRole:  'admin',
                });
            }
        }

        res.json({ message: `Booking đã được ${status === 'confirmed' ? 'xác nhận' : 'huỷ'}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getBookings, getBookingById, updateBookingStatus };