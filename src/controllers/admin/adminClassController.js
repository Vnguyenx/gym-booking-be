// src/controllers/adminClassController.js
//
// Quản lý collection: classes + sub-collection attendance

const { admin, auth, db } = require('../../config/firebase');


const convertTimestamps = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
        result[key] = val?.toDate ? val.toDate().toISOString() : val;
    }
    return result;
};

const getAttendance = async (classId) => {
    const snap = await db.collection('classes').doc(classId)
        .collection('attendance').orderBy('date', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) }));
};

/**
 * GET /api/admin/classes?status=active|expired&ptId=xxx&customerId=xxx
 * Lấy danh sách lớp học, hỗ trợ filter
 */
const getClasses = async (req, res) => {
    try {
        const { status, ptId, customerId } = req.query;
        let query = db.collection('classes').orderBy('startDate', 'desc');

        // Firestore giới hạn 1 inequality filter — dùng where đơn giản
        if (status)     query = db.collection('classes').where('status', '==', status).orderBy('startDate', 'desc');
        if (ptId)       query = db.collection('classes').where('ptId', '==', ptId).orderBy('startDate', 'desc');
        if (customerId) query = db.collection('classes').where('customerId', '==', customerId).orderBy('startDate', 'desc');

        const snap    = await query.get();
        const classes = snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) }));
        res.json({ classes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/admin/classes/:classId
 * Chi tiết 1 lớp kèm attendance
 */
const getClassById = async (req, res) => {
    try {
        const doc = await db.collection('classes').doc(req.params.classId).get();
        if (!doc.exists) return res.status(404).json({ error: 'Không tìm thấy lớp' });

        const attendance = await getAttendance(req.params.classId);
        res.json({ class: { id: doc.id, ...convertTimestamps(doc.data()), attendance } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/admin/classes
 * Tạo lớp học mới
 * Body: { customerId, ptId, type, totalSessions, startDate, endDate, classGroupId? }
 */
const createClass = async (req, res) => {
    const { customerId, ptId, type, totalSessions, startDate, endDate, classGroupId } = req.body;

    if (!customerId || !type || !totalSessions || !startDate || !endDate) {
        return res.status(400).json({ error: 'Thiếu trường bắt buộc' });
    }

    try {
        const newClass = {
            customerId,
            ptId:         ptId ?? '',
            type,
            totalSessions,
            usedSessions: 0,
            startDate:    new Date(startDate),
            endDate:      new Date(endDate),
            classGroupId: classGroupId ?? null,
            status:       'active',
            createdBy:    req.user.uid,
            creatorRole:  'admin',
        };
        const ref = await db.collection('classes').add(newClass);
        res.status(201).json({ message: 'Tạo lớp thành công', classId: ref.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * PATCH /api/admin/classes/:classId
 * Cập nhật lớp (status, ptId, endDate, totalSessions...)
 */
const updateClass = async (req, res) => {
    const ALLOWED = ['status', 'ptId', 'endDate', 'totalSessions', 'usedSessions'];
    try {
        const update = {};
        for (const key of ALLOWED) {
            if (req.body[key] !== undefined) update[key] = req.body[key];
        }
        if (!Object.keys(update).length) {
            return res.status(400).json({ error: 'Không có trường hợp lệ' });
        }
        await db.collection('classes').doc(req.params.classId).update(update);
        res.json({ message: 'Cập nhật lớp thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getClasses, getClassById, createClass, updateClass };