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

        const bookings = await Promise.all(snap.docs.map(async (doc) => {
            const data = doc.data();

            const userDoc = await db.collection('users').doc(data.customerId).get();
            const customerName  = userDoc.exists ? (userDoc.data().displayName || userDoc.data().fullName) : 'Người dùng';
            const customerPhone = userDoc.exists ? userDoc.data().phoneNumber : '';

            const memDoc = await db.collection('memberships').doc(data.membershipId).get();
            const membershipName = memDoc.exists ? memDoc.data().name : data.membershipId;

            let ptName = '';
            if (data.ptId) {
                const ptDoc = await db.collection('pts').doc(data.ptId).get();
                ptName = ptDoc.exists ? ptDoc.data().fullName : '';
            }

            let ptServiceName = '';
            if (data.ptServiceId) {
                const ptServDoc = await db.collection('pt_services').doc(data.ptServiceId).get();
                if (ptServDoc.exists) {
                    ptServiceName = ptServDoc.data().name; // Lấy "Tên dịch vụ" từ DB chứ không map tay
                }
            }

            return {
                id: doc.id,
                ...convertTimestamps(data),
                customerName,
                customerPhone,
                membershipName,
                ptName,
                ptServiceName
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

        const userDoc = await db.collection('users').doc(bookingData.customerId).get();
        const customerName  = userDoc.exists ? userDoc.data().displayName : 'N/A';
        const customerPhone = userDoc.exists ? userDoc.data().phone        : 'N/A';

        const memDoc = await db.collection('memberships').doc(bookingData.membershipId).get();
        const membershipName = memDoc.exists ? memDoc.data().name : 'Gói tập đã xoá';

        let ptServiceName = 'Không thuê PT';
        if (bookingData.ptServiceId && bookingData.ptServiceId !== 'pt-none') {
            const ptServDoc = await db.collection('pt_services').doc(bookingData.ptServiceId).get();
            ptServiceName = ptServDoc.exists ? ptServDoc.data().name : bookingData.ptServiceId;
        }

        let ptName = 'Chưa chọn / Không có';
        if (bookingData.ptId && bookingData.ptId !== '') {
            const ptDoc = await db.collection('pts').doc(bookingData.ptId).get();
            ptName = ptDoc.exists ? ptDoc.data().fullName : 'PT không tồn tại';
        }

        res.json({
            booking: {
                id: doc.id,
                ...convertTimestamps(bookingData),
                customerName,
                customerPhone,
                membershipName,
                ptServiceName,
                ptName,
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * PATCH /api/admin/bookings/:bookingId
 * Duyệt hoặc huỷ đơn.
 *
 * Khi confirmed:
 *   - ptServiceId !== 'pt-none' → tạo class type pt-1on1 / pt-group (có ptId)
 *   - ptServiceId === 'pt-none' → tạo class type 'membership' (ptId = '')
 */
const updateBookingStatus = async (req, res) => {
    const { bookingId } = req.params;
    const { status } = req.body;

    try {
        const bookingRef = db.collection('bookings').doc(bookingId);
        const bookingDoc = await bookingRef.get();
        if (!bookingDoc.exists) return res.status(404).json({ error: 'Không tìm thấy đơn' });

        const data = bookingDoc.data();
        await bookingRef.update({ status, updatedAt: new Date() });

        if (status === 'confirmed') {
            // Lấy thông tin dịch vụ để check type
            const ptServDoc = await db.collection('pt_services').doc(data.ptServiceId).get();
            const ptServiceData = ptServDoc.exists ? ptServDoc.data() : { type: 'none' };

            const memDoc = await db.collection('memberships').doc(data.membershipId).get();
            const durationMonths = memDoc.exists ? memDoc.data().durationMonths : 1;

            const startDate = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + durationMonths);

            // Logic tạo class dựa trên ptServiceData.type
            await db.collection('classes').add({
                customerId: data.customerId,
                ptId: ptServiceData.type === 'none' ? '' : (data.ptId || ''),
                type: ptServiceData.type, // Lấy trực tiếp type: 'pt-1on1', 'pt-group', 'none'
                totalSessions: Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)),
                usedSessions: 0,
                startDate,
                endDate,
                status: 'active',
                createdBy: req.user.uid,
                creatorRole: 'admin',
            });
        }
        res.json({ message: `Đã ${status === 'confirmed' ? 'xác nhận' : 'huỷ'} đơn hàng` });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

/**
 * POST /api/admin/bookings
 * Tạo mới booking cho trường hợp khách thanh toán trực tiếp (walk-in / cash).
 */
const createBooking = async (req, res) => {
    const { customerId, membershipId, ptServiceId, ptId, totalPrice } = req.body;

    try {
        const ptServDoc = await db.collection('pt_services').doc(ptServiceId).get();
        if (!ptServDoc.exists) return res.status(404).json({ error: 'Dịch vụ PT không tồn tại' });

        const ptServiceData = ptServDoc.data();

        // Kiểm tra logic theo type
        if (ptServiceData.type !== 'none' && !ptId) {
            return res.status(400).json({ error: `Dịch vụ ${ptServiceData.name} yêu cầu phải chọn PT` });
        }

        const newBooking = {
            customerId,
            membershipId,
            ptServiceId,
            ptId: ptId || '',
            totalPrice,
            status: 'pending',
            createdAt: new Date(),
        };

        const docRef = await db.collection('bookings').add(newBooking);
        res.status(201).json({ message: 'Tạo booking thành công', id: docRef.id });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = { getBookings, getBookingById, updateBookingStatus, createBooking };