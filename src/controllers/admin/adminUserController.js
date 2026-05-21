// src/controllers/adminUserController.js
//
// Quản lý:
//   users collection (role: customer + pt)
//   pts   collection (hồ sơ chuyên môn PT)
//   pt_applications collection (đơn đăng ký làm PT)

const { admin, auth, db } = require('../../config/firebase');

// ─── Helper ───────────────────────────────────────────────────────────────────

const convertTimestamps = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
        result[key] = val?.toDate ? val.toDate().toISOString() : val;
    }
    return result;
};

// ══════════════════════════════════════════════════════
//  USERS — collection: users
// ══════════════════════════════════════════════════════

/**
 * GET /api/admin/users?role=customer|pt
 * Lấy danh sách user, lọc theo role nếu có query param
 */
const getUsers = async (req, res) => {
    try {
        const { role } = req.query;
        let query = db.collection('users');
        if (role) query = query.where('role', '==', role);

        const snap = await query.orderBy('createdAt', 'desc').get();
        const users = snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) }));
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/admin/users/:uid
 * Lấy chi tiết 1 user
 */
const getUserById = async (req, res) => {
    try {
        const doc = await db.collection('users').doc(req.params.uid).get();
        if (!doc.exists) return res.status(404).json({ error: 'Không tìm thấy user' });
        res.json({ user: { id: doc.id, ...convertTimestamps(doc.data()) } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * PATCH /api/admin/users/:uid
 * Cập nhật thông tin user (displayName, phone, role, avatarUrl)
 * Không cho sửa email và uid qua API này
 */
const updateUser = async (req, res) => {
    const ALLOWED = ['displayName', 'phone', 'role', 'avatarUrl'];
    try {
        const update = {};
        for (const key of ALLOWED) {
            if (req.body[key] !== undefined) update[key] = req.body[key];
        }
        if (!Object.keys(update).length) {
            return res.status(400).json({ error: 'Không có trường hợp lệ để cập nhật' });
        }
        await db.collection('users').doc(req.params.uid).update(update);
        res.json({ message: 'Cập nhật thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * DELETE /api/admin/users/:uid
 * Xoá user (chỉ xoá document Firestore, không xoá Firebase Auth account)
 * Cân nhắc: nên disable thay vì xoá cứng
 */
const deleteUser = async (req, res) => {
    try {
        await db.collection('users').doc(req.params.uid).delete();
        res.json({ message: 'Đã xoá user' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ══════════════════════════════════════════════════════
//  PTs — collection: pts (hồ sơ chuyên môn)
// ══════════════════════════════════════════════════════

/**
 * GET /api/admin/pts
 * Danh sách tất cả PT (hồ sơ chuyên môn)
 */
const getPTs = async (req, res) => {
    try {
        const snap = await db.collection('pts').get();
        const pts  = snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) }));
        res.json({ pts });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/admin/pts/:ptId
 * Chi tiết 1 PT
 */
const getPTById = async (req, res) => {
    try {
        const doc = await db.collection('pts').doc(req.params.ptId).get();
        if (!doc.exists) return res.status(404).json({ error: 'Không tìm thấy PT' });
        res.json({ pt: { id: doc.id, ...convertTimestamps(doc.data()) } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * PATCH /api/admin/pts/:ptId
 * Admin chỉnh sửa hồ sơ PT (tất cả field)
 */
const updatePT = async (req, res) => {
    const ALLOWED = ['fullName', 'gender', 'bio', 'specialty', 'experience', 'isAvailable', 'avatar'];
    try {
        const update = {};
        for (const key of ALLOWED) {
            if (req.body[key] !== undefined) update[key] = req.body[key];
        }
        if (!Object.keys(update).length) {
            return res.status(400).json({ error: 'Không có trường hợp lệ' });
        }
        update.updateAt = new Date();
        await db.collection('pts').doc(req.params.ptId).update(update);
        res.json({ message: 'Cập nhật PT thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ══════════════════════════════════════════════════════
//  PT APPLICATIONS — collection: pt_applications
// ══════════════════════════════════════════════════════

/**
 * GET /api/admin/pt-applications?status=pending|approved|rejected
 */
const getPTApplications = async (req, res) => {
    try {
        const { status } = req.query;
        let query = db.collection('pt_applications').orderBy('createdAt', 'desc');
        if (status) query = db.collection('pt_applications')
            .where('status', '==', status)
            .orderBy('createdAt', 'desc');

        const snap = await query.get();
        const applications = snap.docs.map(d => ({ id: d.id, ...convertTimestamps(d.data()) }));
        res.json({ applications });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * PATCH /api/admin/pt-applications/:id
 * Duyệt hoặc từ chối đơn: body { status: 'approved' | 'rejected' }
 *
 * Khi approved → tạo Firebase Auth account, document trong `users` và `pts`
 */
const reviewPTApplication = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'status phải là approved hoặc rejected' });
    }

    try {
        const appRef = db.collection('pt_applications').doc(id);
        const appDoc = await appRef.get();
        if (!appDoc.exists) return res.status(404).json({ error: 'Không tìm thấy đơn' });

        await appRef.update({ status });

        // Nếu approved → tạo tài khoản Firebase Auth + document trong users + pts
        if (status === 'approved') {
            const data = appDoc.data();

            // 1. Đếm số PT hiện có để tạo password tăng dần (Gymxyz@0001, 0002, ...)
            const ptCountSnap = await db.collection('users').where('role', '==', 'pt').get();
            const ptOrder = String(ptCountSnap.size + 1).padStart(4, '0');
            const tempPassword = `Gymxyz@${ptOrder}`;

            // 2. Tạo Firebase Auth account
            const authUser = await auth.createUser({
                email:    data.email,
                password: tempPassword,
            });
            const uid = authUser.uid;

            // 3. Tạo document trong collection `users`
            await db.collection('users').doc(uid).set({
                uid,
                displayName: data.fullName,
                email:       data.email,
                phone:       data.phone   ?? '',
                avatarUrl:   data.avatarUrl ?? '',
                role:        'pt',
                createdAt:   admin.firestore.FieldValue.serverTimestamp(),
            });

            // 4. Tạo hồ sơ chuyên môn trong collection `pts` (dùng cùng uid)
            await db.collection('pts').doc(uid).set({
                fullName:    data.fullName,
                gender:      data.gender,
                bio:         data.bio,
                specialty:   data.specialty,
                experience:  data.experience,
                avatar:      data.avatarUrl ?? '',
                isAvailable: true,
                updateAt:    admin.firestore.FieldValue.serverTimestamp(),
            });

            // 5. Ghi uid ngược lại vào đơn để tiện tra cứu sau này
            await appRef.update({ uid });
        }

        res.json({ message: `Đơn đã được ${status === 'approved' ? 'duyệt' : 'từ chối'}` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


module.exports = {
    getUsers, getUserById, updateUser, deleteUser,
    getPTs, getPTById, updatePT,
    getPTApplications, reviewPTApplication,
};