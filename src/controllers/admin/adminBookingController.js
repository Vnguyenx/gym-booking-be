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

            const ptServiceNames = {
                'pt-none':  'Không thuê PT',
                'pt-1on1':  'Thuê PT 1:1',
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

        // Tạo class khi confirmed — với mọi loại ptServiceId
        if (status === 'confirmed') {
            const data = bookingDoc.data();

            // Lấy thông tin membership để tính số buổi và thời hạn
            const memDoc = await db.collection('memberships').doc(data.membershipId).get();
            const durationMonths = memDoc.exists ? memDoc.data().durationMonths : 1;

            const startDate  = new Date();
            const endDate    = new Date();
            endDate.setMonth(endDate.getMonth() + durationMonths);

            // Tổng số buổi = số ngày thực tế (gói 1m ~ 30, gói 3m ~ 90, ...)
            const msPerDay      = 1000 * 60 * 60 * 24;
            const totalSessions = Math.round((endDate - startDate) / msPerDay);

            const isPtService = data.ptServiceId && data.ptServiceId !== 'pt-none';

            await db.collection('classes').add({
                customerId:   data.customerId,
                ptId:         isPtService ? (data.ptId || '') : '',
                type:         isPtService
                    ? (data.ptServiceId === 'pt-1on1' ? 'pt-1on1' : 'pt-group')
                    : 'pt-none',
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

        res.json({ message: `Booking đã được ${status === 'confirmed' ? 'xác nhận' : 'huỷ'}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/admin/bookings
 * Tạo mới booking cho trường hợp khách thanh toán trực tiếp (walk-in / cash).
 */
const createBooking = async (req, res) => {
    const { customerId, membershipId, ptServiceId, ptId, totalPrice } = req.body;

    if (!customerId || !membershipId || !ptServiceId || totalPrice == null) {
        return res.status(400).json({
            error: 'Thiếu thông tin bắt buộc: customerId, membershipId, ptServiceId, totalPrice'
        });
    }
    if (ptServiceId !== 'pt-none' && !ptId) {
        return res.status(400).json({ error: 'ptId là bắt buộc khi chọn dịch vụ PT' });
    }
    if (typeof totalPrice !== 'number' || totalPrice < 0) {
        return res.status(400).json({ error: 'totalPrice phải là số không âm' });
    }

    try {
        const [userDoc, memDoc] = await Promise.all([
            db.collection('users').doc(customerId).get(),
            db.collection('memberships').doc(membershipId).get(),
        ]);

        if (!userDoc.exists) return res.status(404).json({ error: 'Không tìm thấy khách hàng' });
        if (!memDoc.exists)  return res.status(404).json({ error: 'Không tìm thấy gói tập' });

        let ptDoc = null;
        if (ptId) {
            ptDoc = await db.collection('pts').doc(ptId).get();
            if (!ptDoc.exists) return res.status(404).json({ error: 'Không tìm thấy PT' });
        }

        const newBooking = {
            customerId,
            membershipId,
            ptServiceId,
            ptId:       ptId || '',
            totalPrice,
            status:     'pending',
            createdAt:  new Date(),
        };

        const docRef = await db.collection('bookings').add(newBooking);

        // Join để trả về
        const userData      = userDoc.data();
        const customerName  = userData.displayName || 'Người dùng';
        const customerPhone = userData.phone || '';
        const membershipName = memDoc.data().name;

        let ptServiceName = 'Không thuê PT';
        if (ptServiceId !== 'pt-none') {
            const ptServDoc = await db.collection('pt_services').doc(ptServiceId).get();
            ptServiceName = ptServDoc.exists ? ptServDoc.data().name : ptServiceId;
        }

        const ptName = ptDoc ? (ptDoc.data().fullName || '') : 'Chưa chọn / Không có';

        res.status(201).json({
            message: 'Tạo booking thành công',
            booking: {
                id: docRef.id,
                ...convertTimestamps(newBooking),
                customerName,
                customerPhone,
                membershipName,
                ptServiceName,
                ptName,
            },
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getBookings, getBookingById, updateBookingStatus, createBooking };