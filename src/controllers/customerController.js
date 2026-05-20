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
            const parseDate = (d) => {
                if (!d) return null;
                if (d.toDate) return d.toDate().toISOString(); // Firestore Timestamp
                return d; // đã là string rồi, trả về luôn
            };

            return {
                id: doc.id,
                ...data,
                createdAt: parseDate(data.createdAt),
                paidAt:    parseDate(data.paidAt),
            };
        });

        res.json({ bookings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
/**
 * Lấy danh sách lớp học + điểm danh của customer.
 * Mỗi classItem có mảng attendance lồng bên trong.
 */
const getMyClasses = async (req, res) => {
    try {
        const uid = req.user.uid;

        // Kéo ra ngoài — dùng chung cho cả class lẫn attendance
        const processDate = (d) => {
            if (!d) return null;
            if (d.toDate) return d.toDate().toISOString();
            return d;
        };

        const classesSnap = await db
            .collection('classes')
            .where('customerId', '==', uid)
            .orderBy('startDate', 'desc')
            .get();

        const classes = await Promise.all(
            classesSnap.docs.map(async (doc) => {
                const data = doc.data();

                const attendanceSnap = await doc.ref
                    .collection('attendance')
                    .orderBy('date', 'desc')
                    .get();

                const attendance = attendanceSnap.docs.map((a) => {
                    const att = a.data();
                    return {
                        id:             a.id,
                        date:           processDate(att.date),
                        isSuccess:      att.isSuccess,
                        type:           att.type,
                        customerStatus: att.customerStatus,
                        ptStatus:       att.ptStatus,
                        secretCodeUsed: att.secretCodeUsed,
                    };
                });

                return {
                    id:        doc.id,
                    ...data,
                    startDate: processDate(data.startDate),
                    endDate:   processDate(data.endDate),
                    attendance,
                };
            })
        );

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

/**
 * POST /api/customer/checkin
 * Customer nhập mã bí mật để điểm danh
 */
const checkin = async (req, res) => {
    try {
        const uid = req.user.uid;
        const { classId, secretCode } = req.body;

        // 1. Kiểm tra Secret Code từ hệ thống
        const configDoc = await db.collection('gym_settings').doc('daily_config').get();
        if (!configDoc.exists || configDoc.data().currentSecretCode !== secretCode) {
            return res.status(400).json({ error: 'Mã bí mật không đúng hoặc chưa được khởi tạo' });
        }

        // 2. Kiểm tra thông tin lớp học
        const classRef = db.collection('classes').doc(classId);
        const classDoc = await classRef.get();

        if (!classDoc.exists || classDoc.data().customerId !== uid) {
            return res.status(404).json({ error: 'Không tìm thấy thông tin gói tập' });
        }

        const classData = classDoc.data();
        if (classData.status !== 'active') return res.status(400).json({ error: 'Gói tập đã hết hạn hoặc bị khóa' });
        if (classData.usedSessions >= classData.totalSessions) return res.status(400).json({ error: 'Bạn đã dùng hết số buổi tập' });

        // 3. Kiểm tra xem hôm nay đã điểm danh chưa (tránh trùng)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existingAtt = await classRef.collection('attendance')
            .where('date', '>=', today.toISOString())
            .where('isSuccess', '==', true)
            .get();

        if (!existingAtt.empty) return res.status(400).json({ error: 'Bạn đã điểm danh thành công hôm nay rồi' });

        // 4. Tạo record điểm danh dựa trên loại gói
        const isPT = classData.type === 'pt_coaching';
        const attendanceRecord = {
            date: new Date().toISOString(),
            isSuccess: true,
            type: isPT ? "pt_session" : "membership_checkin",
            customerStatus: "confirmed",
            ptStatus: isPT ? "none" : null, // PT sẽ confirm sau nếu là gói PT
            secretCodeUsed: secretCode
        };

        const newAtt = await classRef.collection('attendance').add(attendanceRecord);

        // 5. Cập nhật số buổi đã dùng
        await classRef.update({
            usedSessions: admin.firestore.FieldValue.increment(1)
        });

        res.json({
            message: 'Điểm danh thành công',
            record: { id: newAtt.id, ...attendanceRecord }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getMyBookings, getMyClasses, updateProfile, cancelBooking, getPTs, checkin };