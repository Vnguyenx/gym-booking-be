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
// Thêm hàm helper này ở đầu file hoặc bên ngoài các controller để dùng chung
const isValidPath = (path) => typeof path === 'string' && path.trim() !== '';

const getClasses = async (req, res) => {
    try {
        const { status } = req.query;
        let query = db.collection('classes').orderBy('startDate', 'desc');
        if (status && status !== 'all') {
            query = query.where('status', '==', status);
        }

        const snap = await query.get();

        const classes = await Promise.all(snap.docs.map(async (doc) => {
            const data = doc.data();

            // 1. CHỐT CHẶN: customerId (Dòng này thường xuyên gây lỗi nhất nếu DB có rác)
            let customerName = 'Khách lẻ';
            if (isValidPath(data.customerId)) {
                const userDoc = await db.collection('users').doc(data.customerId).get();
                if (userDoc.exists) {
                    customerName = userDoc.data().displayName || userDoc.data().fullName || 'N/A';
                }
            }

            // 2. CHỐT CHẶN: ptId
            let ptName = 'Không có';
            if (isValidPath(data.ptId)) {
                const ptDoc = await db.collection('pts').doc(data.ptId).get();
                if (ptDoc.exists) ptName = ptDoc.data().fullName;
            }

            // 3. CHỐT CHẶN: ptServiceId (Lấy theo TYPE thay vì ID cứng)
            let ptServiceName = 'Dịch vụ mặc định';
            if (isValidPath(data.type)) {
                const ptServDoc = await db.collection('pt_services').doc(data.type).get();
                if (ptServDoc.exists) {
                    ptServiceName = ptServDoc.data().name;
                }
            }

            return {
                id: doc.id,
                ...convertTimestamps(data),
                customerName,
                ptName,
                ptServiceName
            };
        }));

        res.json({ classes });
    } catch (err) {
        console.error("Lỗi GetClasses:", err.message);
        res.status(500).json({ error: err.message });
    }
};

const getClassById = async (req, res) => {
    try {
        const doc = await db.collection('classes').doc(req.params.classId).get();
        if (!doc.exists) return res.status(404).json({ error: 'Không tìm thấy lớp' });

        const data = doc.data();

        let customerName = 'Khách lẻ';
        if (isValidPath(data.customerId)) {
            const userDoc = await db.collection('users').doc(data.customerId).get();
            customerName = userDoc.exists ? (userDoc.data().displayName || userDoc.data().fullName) : 'N/A';
        }

        let ptName = 'Không có';
        if (isValidPath(data.ptId)) {
            const ptDoc = await db.collection('pts').doc(data.ptId).get();
            ptName = ptDoc.exists ? ptDoc.data().fullName : 'N/A';
        }

        let ptServiceName = 'Dịch vụ mặc định';
        if (isValidPath(data.ptServiceId)) {
            const ptServDoc = await db.collection('pt_services').doc(data.ptServiceId).get();
            if (ptServDoc.exists) ptServiceName = ptServDoc.data().name;
        } else if (isValidPath(data.type)) {
            const ptServDoc = await db.collection('pt_services').doc(data.type).get();
            if (ptServDoc.exists) ptServiceName = ptServDoc.data().name;
        }

        const attendance = await getAttendance(doc.id);

        res.json({
            class: {
                id: doc.id,
                ...convertTimestamps(data),
                customerName,
                ptName,
                ptServiceName,
                attendance
            }
        });
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