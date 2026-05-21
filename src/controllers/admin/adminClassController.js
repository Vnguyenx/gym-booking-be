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

// Hàm helper để lấy tên người dùng/PT từ ID
const getNameMap = async (collectionName, ids, nameField) => {
    if (!ids.length) return {};
    const map = {};
    const chunks = [];
    // Firestore giới hạn 'in' tối đa 30 items
    for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));

    for (const chunk of chunks) {
        const snap = await db.collection(collectionName).where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
        snap.forEach(doc => { map[doc.id] = doc.data()[nameField]; });
    }
    return map;
};

/**
 * GET /api/admin/classes?status=active|expired&ptId=xxx&customerId=xxx
 * Lấy danh sách lớp học, hỗ trợ filter
 */
const getClasses = async (req, res) => {
    try {
        const { status, ptId, customerId } = req.query;
        let query = db.collection('classes');

        // Filter xử lý "Tất cả" (nếu status không có hoặc là rỗng thì không where)
        if (status && status !== 'all') query = query.where('status', '==', status);
        if (ptId) query = query.where('ptId', '==', ptId);
        if (customerId) query = query.where('customerId', '==', customerId);

        const snap = await query.orderBy('startDate', 'desc').get();
        const rawClasses = snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) }));

        // --- BƯỚC KẾT BẢNG (LOOKUP NAMES) ---
        const customerIds = [...new Set(rawClasses.map(c => c.customerId))];
        const ptIds = [...new Set(rawClasses.map(c => c.ptId).filter(id => id))];
        const creatorIds = [...new Set(rawClasses.map(c => c.createdBy).filter(id => id))];

        const [customerNames, ptNames,creatorNames] = await Promise.all([
            getNameMap('users', customerIds, 'displayName'),
            getNameMap('pts', ptIds, 'fullName'),
            getNameMap('users', creatorIds, 'displayName')
        ]);
        const typeMapping = {
            'pt-1on1': 'PT Kèm 1:1',
            'pt-group': 'Lớp Nhóm PT',
            'membership': 'Gói Hội Viên'
        };

        const classes = rawClasses.map(c => ({
            ...c,
            customerName: customerNames[c.customerId] || 'Nguời dùng cũ',
            ptName: ptNames[c.ptId] || 'Chưa phân công',
            creatorName: creatorNames[c.createdBy] || 'Hệ thống',
            typeName: typeMapping[c.type] || c.type
        }));

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
        const { classId } = req.params;
        const doc = await db.collection('classes').doc(classId).get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Không tìm thấy lớp' });
        }
        const classData = { id: doc.id, ...convertTimestamps(doc.data()) };

        // 1. Lấy dữ liệu tên từ các collection khác song song
        const [userDoc, ptDoc, creatorDoc] = await Promise.all([
            db.collection('users').doc(classData.customerId).get(),
            classData.ptId ? db.collection('pts').doc(classData.ptId).get() : Promise.resolve(null),
            classData.createdBy ? db.collection('users').doc(classData.createdBy).get() : Promise.resolve(null)
        ]);

        // 2. Map tên loại dịch vụ (Mapping này nên để ở một file constants dùng chung)
        const typeMapping = {
            'pt-1on1': 'PT Kèm 1:1',
            'pt-group': 'Lớp Nhóm PT',
            'membership': 'Gói Hội Viên'
        };

        // 3. Lấy danh sách điểm danh
        const attendance = await getAttendance(classId);

        const enrichedClass = {
            ...classData,
            customerName: userDoc.exists ? userDoc.data().displayName : 'Khách hàng cũ',
            ptName: ptDoc?.exists ? ptDoc.data().fullName : 'Chưa phân công',
            creatorName: creatorDoc?.exists ? creatorDoc.data().displayName : 'Hệ thống',
            typeName: typeMapping[classData.type] || classData.type,
            attendance
        };

        res.json({ class: enrichedClass });
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
    const { customerName, ptName, type, totalSessions, startDate, endDate, classGroupId } = req.body;

    if (!customerName || !type || !totalSessions || !startDate || !endDate) {
        return res.status(400).json({ error: 'Thiếu trường bắt buộc' });
    }

    try {
        const userSnap = await db.collection('users').where('displayName', '==', customerName).limit(1).get();
        if (userSnap.empty) return res.status(404).json({ error: 'Không tìm thấy khách hàng này' });
        const customerId = userSnap.docs[0].id;

        let ptId = '';
        if (ptName) {
            const ptSnap = await db.collection('pts').where('fullName', '==', ptName).limit(1).get();
            if (!ptSnap.empty) ptId = ptSnap.docs[0].id;
        }

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
 * Cập nhật lớp (Hỗ trợ đổi PT bằng tên và cập nhật các thông tin khác)
 */
const updateClass = async (req, res) => {
    // 1. Bổ sung thêm classGroupId vào bốc tách dữ liệu (Destructuring)
    const { status, ptName, endDate, totalSessions, usedSessions, classGroupId } = req.body;
    const { classId } = req.params;

    try {
        const updateData = {};

        if (ptName) {
            const ptSnap = await db.collection('pts')
                .where('fullName', '==', ptName)
                .limit(1)
                .get();

            if (!ptSnap.empty) {
                updateData.ptId = ptSnap.docs[0].id;
            } else {
                return res.status(404).json({ error: 'Không tìm thấy PT có tên này' });
            }
        }

        if (status !== undefined) updateData.status = status;
        if (totalSessions !== undefined) updateData.totalSessions = Number(totalSessions);
        if (usedSessions !== undefined) updateData.usedSessions = Number(usedSessions);

        // 2. THÊM LOGIC XỬ LÝ CLASSGROUPID VÀO ĐÂY
        // Nếu truyền chuỗi rỗng '' thì set về null (nghĩa là hủy học nhóm, chuyển sang học cá nhân)
        if (classGroupId !== undefined) {
            updateData.classGroupId = classGroupId === '' ? null : classGroupId;
        }

        if (endDate) {
            updateData.endDate = admin.firestore.Timestamp.fromDate(new Date(endDate));
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: 'Không có dữ liệu hợp lệ để cập nhật' });
        }

        await db.collection('classes').doc(classId).update(updateData);

        res.json({
            message: 'Cập nhật thành công',
            updatedFields: updateData
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getClasses, getClassById, createClass, updateClass };