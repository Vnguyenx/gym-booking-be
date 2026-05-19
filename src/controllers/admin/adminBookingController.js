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
        if (status) query = db.collection('bookings')
            .where('status', '==', status)
            .orderBy('createdAt', 'desc');

        const snap     = await query.get();
        const bookings = snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) }));
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
        const doc = await db.collection('bookings').doc(req.params.bookingId).get();
        if (!doc.exists) return res.status(404).json({ error: 'Không tìm thấy booking' });
        res.json({ booking: { id: doc.id, ...convertTimestamps(doc.data()) } });
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