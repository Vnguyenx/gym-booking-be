// src/controllers/customerController.js
const { db } = require('../config/firebase');

// ─── GET /api/customer/bookings ───────────────────────────────────────────────

/**
 * Lấy lịch sử lịch hẹn / buổi học của customer.
 * Sắp xếp mới nhất lên đầu (orderBy createdAt desc).
 */
const getMyBookings = async (req, res) => {
    try {
        const uid = req.user.uid;

        const snap = await db
            .collection('bookings')
            .where('customerId', '==', uid)
            .orderBy('createdAt', 'desc')
            .get();

        const bookings = snap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate().toISOString() ?? null,
                paidAt:    data.paidAt?.toDate().toISOString()    ?? null,
            };
        });

        res.json({ bookings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// ─── GET /api/customer/classes ────────────────────────────────────────────────

/**
 * Lấy danh sách lớp học + điểm danh của customer.
 * Mỗi classItem có mảng attendance lồng bên trong.
 */
const getMyClasses = async (req, res) => {
    try {
        const uid = req.user.uid;

        const snap = await db
            .collection('classes')
            .where('customerId', '==', uid)
            .get();

        const classes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        res.json({ classes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─── PUT /api/customer/profile ────────────────────────────────────────────────

/**
 * Cập nhật thông tin cá nhân: displayName, phone, avatarUrl.
 * Email không cho sửa — bỏ qua dù FE có gửi lên.
 */
const updateProfile = async (req, res) => {
    try {
        const uid = req.user.uid;
        const { displayName, phone, avatarUrl } = req.body;

        // Chỉ cập nhật các field được phép, bỏ qua email và role
        const updateData = {};
        if (displayName !== undefined) updateData.displayName = displayName;
        if (phone       !== undefined) updateData.phone       = phone;
        if (avatarUrl   !== undefined) updateData.avatarUrl   = avatarUrl;

        await db.collection('users').doc(uid).update(updateData);

        // Trả về data mới để FE cập nhật store luôn
        const updatedDoc = await db.collection('users').doc(uid).get();

        res.json({ user: updatedDoc.data() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// PATCH /api/customer/bookings/:id/cancel
const cancelBooking = async (req, res) => {
    try {
        const uid = req.user.uid;
        const { id } = req.params;

        const bookingRef = db.collection('bookings').doc(id);
        const bookingDoc = await bookingRef.get();

        if (!bookingDoc.exists)
            return res.status(404).json({ error: 'Không tìm thấy đăng ký' });

        const booking = bookingDoc.data();

        // Chỉ cho huỷ booking của chính mình
        if (booking.customerId !== uid)
            return res.status(403).json({ error: 'Không có quyền huỷ đăng ký này' });

        // Chỉ cho huỷ khi đang pending
        if (booking.status !== 'pending')
            return res.status(400).json({ error: 'Chỉ có thể huỷ đăng ký đang chờ xác nhận' });

        await bookingRef.update({ status: 'cancelled' });

        res.json({ message: 'Huỷ đăng ký thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /api/pts
const getPTs = async (req, res) => {
    try {
        const snap = await db.collection('pts').get();
        const pts  = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        res.json({ pts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getMyBookings, getMyClasses, updateProfile, cancelBooking, getPTs };