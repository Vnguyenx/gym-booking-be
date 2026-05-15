// controllers/adminController.js
const { admin, auth, db } = require('../config/firebase');

const VALID_CLASS_TYPES = ['pt-none', 'pt-1on1', 'pt-group'];

// ─────────────────────────────────────────────────────────
// PATCH /api/admin/users/:uid/role
// Body: { role: "pt" | "customer" | "admin" }
// ─────────────────────────────────────────────────────────
const updateUserRole = async (req, res) => {
    const { uid } = req.params;
    const { role } = req.body;

    const VALID_ROLES = ['pt', 'customer', 'admin'];
    if (!role || !VALID_ROLES.includes(role)) {
        return res.status(400).json({
            error: `Role không hợp lệ. Chỉ chấp nhận: ${VALID_ROLES.join(', ')}`,
        });
    }

    try {
        const userDoc = await db.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'Không tìm thấy tài khoản' });
        }

        await Promise.all([
            db.collection('users').doc(uid).update({ role }),
            auth.setCustomUserClaims(uid, { role }),
        ]);

        res.json({ message: `Đã cập nhật role thành "${role}" cho user ${uid}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ─────────────────────────────────────────────────────────
// POST /api/admin/classes
// Body: { customerId, ptId, type, startDate, endDate, totalSessions, classGroupId? }
//
// Quy tắc classGroupId:
//   "pt-none"  → classGroupId bị bỏ qua (luôn null)
//   "pt-1on1"  → classGroupId bị bỏ qua (luôn null)
//   "pt-group" → classGroupId BẮT BUỘC (string, dùng để group các member cùng nhóm)
//
// Quy tắc ptId:
//   "pt-none"  → ptId bị bỏ qua (luôn "")
//   "pt-1on1"  → ptId BẮT BUỘC
//   "pt-group" → ptId BẮT BUỘC
// ─────────────────────────────────────────────────────────
const createClass = async (req, res) => {
    const { customerId, ptId = '', type, startDate, endDate, totalSessions, classGroupId } = req.body;

    // Validate type trước
    if (!type || !VALID_CLASS_TYPES.includes(type)) {
        return res.status(400).json({
            error: `type không hợp lệ. Chỉ chấp nhận: ${VALID_CLASS_TYPES.join(', ')}`,
        });
    }

    // Validate các field bắt buộc chung
    const required = { customerId, type, startDate, endDate, totalSessions };
    const missing = Object.entries(required)
        .filter(([, v]) => v === undefined || v === null || v === '')
        .map(([k]) => k);

    if (missing.length > 0) {
        return res.status(400).json({ error: `Thiếu trường bắt buộc: ${missing.join(', ')}` });
    }

    if (typeof totalSessions !== 'number' || totalSessions <= 0) {
        return res.status(400).json({ error: 'totalSessions phải là số nguyên dương' });
    }

    // Validate theo type
    if (type === 'pt-1on1' || type === 'pt-group') {
        if (!ptId) {
            return res.status(400).json({ error: `type "${type}" yêu cầu ptId` });
        }
    }

    if (type === 'pt-group') {
        if (!classGroupId || typeof classGroupId !== 'string' || !classGroupId.trim()) {
            return res.status(400).json({ error: 'type "pt-group" yêu cầu classGroupId' });
        }
    }

    try {
        // Kiểm tra customer tồn tại
        const customerDoc = await db.collection('users').doc(customerId).get();
        if (!customerDoc.exists) {
            return res.status(404).json({ error: 'Không tìm thấy customer' });
        }

        // Kiểm tra PT tồn tại (nếu có)
        if (ptId) {
            const ptDoc = await db.collection('users').doc(ptId).get();
            if (!ptDoc.exists) {
                return res.status(404).json({ error: 'Không tìm thấy PT' });
            }
        }

        const newClass = {
            customerId,
            ptId:         type === 'pt-none' ? '' : ptId,
            type,
            classGroupId: type === 'pt-group' ? classGroupId.trim() : null,
            startDate,
            endDate,
            totalSessions,
            usedSessions:  0,
            status:       'active',
            createdBy:    req.user.uid,
            creatorRole:  req.user.role,
            createdAt:    admin.firestore.FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection('classes').add(newClass);

        res.status(201).json({
            message: 'Tạo lớp học thành công',
            classId: docRef.id,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { updateUserRole, createClass };