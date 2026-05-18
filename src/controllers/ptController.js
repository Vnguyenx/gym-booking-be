// controllers/ptController.js
const { db } = require('../config/firebase');

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

const getAttendanceForClass = async (classId) => {
    const snap = await db
        .collection('classes')
        .doc(classId)
        .collection('attendance')
        .orderBy('date', 'desc')
        .get();

    return snap.docs.map((d) => ({ id: d.id, ...convertTimestamps(d.data()) }));
};

const fetchCustomerInfo = async (customerIds) => {
    const uniqueIds = [...new Set(customerIds)].filter(Boolean);
    const infoMap = new Map();

    if (uniqueIds.length === 0) return infoMap;  // guard: tránh lỗi `in []`

    for (let i = 0; i < uniqueIds.length; i += 30) {
        const chunk = uniqueIds.slice(i, i + 30);
        const snap = await db
            .collection('users')
            .where('__name__', 'in', chunk)
            .get();

        snap.docs.forEach((doc) => {
            const data = doc.data();
            infoMap.set(doc.id, {
                name:   data.displayName || data.fullName || data.email || doc.id,
                avatar: data.avatar || data.photoURL || null,
            });
        });
    }

    return infoMap;
};

// GET /api/pt/students
const getActiveStudents = async (req, res) => {
    try {
        const ptId = req.user.uid;
        console.log('[getActiveStudents] step1 - ptId:', ptId);

        const classesSnap = await db
            .collection('classes')
            .where('ptId', '==', ptId)
            .where('status', '==', 'active')
            .orderBy('startDate', 'desc')
            .get();
        console.log('[getActiveStudents] step2 - classes found:', classesSnap.size);

        const rawClasses = await Promise.all(
            classesSnap.docs.map(async (doc) => {
                const classData = convertTimestamps(doc.data());
                const attendance = await getAttendanceForClass(doc.id);
                return { id: doc.id, ...classData, attendance };
            })
        );
        console.log('[getActiveStudents] step3 - rawClasses built:', rawClasses.length);

        const customerIds = rawClasses.map((c) => c.customerId);
        console.log('[getActiveStudents] step4 - customerIds:', customerIds);

        const infoMap = await fetchCustomerInfo(customerIds);
        console.log('[getActiveStudents] step5 - infoMap size:', infoMap.size);

        const classes = rawClasses.map((c) => {
            const info = infoMap.get(c.customerId);
            return {
                ...c,
                customerName:   info?.name   ?? c.customerId,
                customerAvatar: info?.avatar ?? null,
            };
        });

        console.log('[getActiveStudents] step6 - done, returning', classes.length, 'classes');
        res.json({ classes });
    } catch (err) {
        console.error('[getActiveStudents] FAILED:', err.message);
        console.error(err.stack);
        res.status(500).json({ error: err.message });
    }
};

// GET /api/pt/students/history
const getExpiredStudents = async (req, res) => {
    try {
        const ptId = req.user.uid;
        console.log('[getExpiredStudents] step1 - ptId:', ptId);

        const classesSnap = await db
            .collection('classes')
            .where('ptId', '==', ptId)
            .where('status', '==', 'expired')
            .orderBy('startDate', 'desc')
            .get();
        console.log('[getExpiredStudents] step2 - classes found:', classesSnap.size);

        const rawClasses = await Promise.all(
            classesSnap.docs.map(async (doc) => {
                const classData = convertTimestamps(doc.data());
                const attendance = await getAttendanceForClass(doc.id);
                return { id: doc.id, ...classData, attendance };
            })
        );
        console.log('[getExpiredStudents] step3 - rawClasses built:', rawClasses.length);

        const customerIds = rawClasses.map((c) => c.customerId);
        console.log('[getExpiredStudents] step4 - customerIds:', customerIds);

        const infoMap = await fetchCustomerInfo(customerIds);
        console.log('[getExpiredStudents] step5 - infoMap size:', infoMap.size);

        const classes = rawClasses.map((c) => {
            const info = infoMap.get(c.customerId);
            return {
                ...c,
                customerName:   info?.name   ?? c.customerId,
                customerAvatar: info?.avatar ?? null,
            };
        });

        res.json({ classes });
    } catch (err) {
        console.error('[getExpiredStudents] FAILED:', err.message);
        console.error(err.stack);
        res.status(500).json({ error: err.message });
    }
};

// POST /api/pt/confirm/:attendanceId
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
        console.error('[confirmAttendance] FAILED:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// PUT /api/pt/profile
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
        console.error('[updateProfile] FAILED:', err.message);
        res.status(500).json({ error: err.message });
    }
};

// GET /api/pt/me
const getMyProfile = async (req, res) => {
    try {
        const uid = req.user.uid;
        const doc = await db.collection('pts').doc(uid).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Không tìm thấy hồ sơ PT' });
        }

        res.json({ pt: { id: doc.id, ...doc.data() } });
    } catch (err) {
        console.error('[getMyProfile] FAILED:', err.message);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getActiveStudents,
    getExpiredStudents,
    confirmAttendance,
    updateProfile,
    getMyProfile,
};