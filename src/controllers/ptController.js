// controllers/ptController.js
const { db } = require('../config/firebase');

// Helper: convert Firestore Timestamps trong object sang ISO string
const convertTimestamps = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
        if (val && typeof val.toDate === 'function') {
            result[key] = val.toDate().toISOString();
        } else {
            result[key] = val;
        }
    }
    return result;
};

// Helper: lấy attendance subcollection của một class, desc theo date
const getAttendanceForClass = async (classId) => {
    const snap = await db
        .collection('classes')
        .doc(classId)
        .collection('attendance')
        .orderBy('date', 'desc')
        .get();

    return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) }));
};

// ─────────────────────────────────────────────────────────
// GET /api/pt/students
// Trả về tất cả class đang active mà PT này phụ trách
//
// type từ pt_services:
//   "pt-1on1"  → PT kèm riêng 1:1
//   "pt-group" → PT tập nhóm  (FE group theo type, không cần classGroupId)
//   "pt-none"  → Tự tập — sẽ không xuất hiện ở đây vì ptId rỗng
// ─────────────────────────────────────────────────────────
const getActiveStudents = async (req, res) => {
    try {
        const ptId = req.user.uid;

        const classesSnap = await db
            .collection('classes')
            .where('ptId', '==', ptId)
            .where('status', '==', 'active')
            .orderBy('startDate', 'desc')   // cần composite index: ptId ASC + status ASC + startDate DESC
            .get();

        const classes = await Promise.all(
            classesSnap.docs.map(async (doc) => {
                const classData = convertTimestamps(doc.data());
                const attendance = await getAttendanceForClass(doc.id);
                return { id: doc.id, ...classData, attendance };
            })
        );

        res.json({ classes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─────────────────────────────────────────────────────────
// GET /api/pt/students/history
// Giống trên nhưng status == "expired"
// Dùng chung composite index với getActiveStudents
// ─────────────────────────────────────────────────────────
const getExpiredStudents = async (req, res) => {
    try {
        const ptId = req.user.uid;

        const classesSnap = await db
            .collection('classes')
            .where('ptId', '==', ptId)
            .where('status', '==', 'expired')
            .orderBy('startDate', 'desc')
            .get();

        const classes = await Promise.all(
            classesSnap.docs.map(async (doc) => {
                const classData = convertTimestamps(doc.data());
                const attendance = await getAttendanceForClass(doc.id);
                return { id: doc.id, ...classData, attendance };
            })
        );

        res.json({ classes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─────────────────────────────────────────────────────────
// POST /api/pt/confirm/:attendanceId
// Body: { classId }
// PT xác nhận buổi tập — chỉ update ptStatus, KHÔNG tăng usedSessions
// ─────────────────────────────────────────────────────────
const confirmAttendance = async (req, res) => {
    const { attendanceId } = req.params;
    const { classId } = req.body;
    const ptId = req.user.uid;

    if (!classId) {
        return res.status(400).json({ error: 'Thiếu classId' });
    }

    try {
        const classDoc = await db.collection('classes').doc(classId).get();
        if (!classDoc.exists) {
            return res.status(404).json({ error: 'Không tìm thấy lớp học' });
        }
        if (classDoc.data().ptId !== ptId) {
            return res.status(403).json({ error: 'Bạn không phụ trách lớp học này' });
        }

        const attendanceRef = db
            .collection('classes')
            .doc(classId)
            .collection('attendance')
            .doc(attendanceId);

        const attendanceDoc = await attendanceRef.get();
        if (!attendanceDoc.exists) {
            return res.status(404).json({ error: 'Không tìm thấy bản ghi điểm danh' });
        }

        await attendanceRef.update({ ptStatus: 'confirmed' });
        res.json({ message: 'Xác nhận buổi tập thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─────────────────────────────────────────────────────────
// PUT /api/pt/profile
// Chỉ cho sửa: bio, specialty[], experience, isAvailable
// ─────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
    const uid = req.user.uid;
    const { bio, specialty, experience, isAvailable } = req.body;

    const allowedUpdate = {};
    if (bio !== undefined) allowedUpdate.bio = bio;
    if (specialty !== undefined) allowedUpdate.specialty = specialty;
    if (experience !== undefined) allowedUpdate.experience = experience;
    if (isAvailable !== undefined) allowedUpdate.isAvailable = isAvailable;

    if (Object.keys(allowedUpdate).length === 0) {
        return res.status(400).json({ error: 'Không có trường hợp lệ để cập nhật' });
    }

    try {
        await db.collection('users').doc(uid).update(allowedUpdate);
        res.json({ message: 'Cập nhật hồ sơ thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getActiveStudents,
    getExpiredStudents,
    confirmAttendance,
    updateProfile,
};