// src/controllers/adminContentController.js
//
// Quản lý nội dung trang chủ:
//   gym_info, gym_settings, banners, pt_info, zones

const { admin, auth, db } = require('../../config/firebase');

// ══════════════════════════════════════════════════════
//  GYM INFO — document: gym_info/main-gym
// ══════════════════════════════════════════════════════

/** GET /api/admin/gym-info */
const getGymInfo = async (req, res) => {
    try {
        const doc = await db.collection('gym_info').doc('main-gym').get();
        if (!doc.exists) return res.status(404).json({ error: 'Chưa có thông tin gym' });
        res.json({ gymInfo: { id: doc.id, ...doc.data() } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** PUT /api/admin/gym-info — ghi đè toàn bộ hoặc merge */
const updateGymInfo = async (req, res) => {
    try {
        await db.collection('gym_info').doc('main-gym').set(req.body, { merge: true });
        res.json({ message: 'Cập nhật thông tin gym thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ══════════════════════════════════════════════════════
//  GYM SETTINGS
// ══════════════════════════════════════════════════════

/** GET /api/admin/gym-settings/:docId (daily_config | payment) */
const getGymSetting = async (req, res) => {
    try {
        const doc = await db.collection('gym_settings').doc(req.params.docId).get();
        if (!doc.exists) return res.status(404).json({ error: 'Không tìm thấy cài đặt' });
        res.json({ setting: { id: doc.id, ...doc.data() } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** PATCH /api/admin/gym-settings/:docId */
const updateGymSetting = async (req, res) => {
    try {
        await db.collection('gym_settings').doc(req.params.docId).set(req.body, { merge: true });
        res.json({ message: 'Cập nhật cài đặt thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ══════════════════════════════════════════════════════
//  BANNERS — collection: banners
// ══════════════════════════════════════════════════════

/** GET /api/admin/banners */
const getBanners = async (req, res) => {
    try {
        const snap    = await db.collection('banners').orderBy('order').get();
        const banners = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        res.json({ banners });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** POST /api/admin/banners */
const createBanner = async (req, res) => {
    const { title, subtitle, imageUrl, link, order, isActive } = req.body;
    if (!imageUrl) return res.status(400).json({ error: 'imageUrl là bắt buộc' });
    try {
        const ref = await db.collection('banners').add({
            title: title ?? '', subtitle: subtitle ?? '',
            imageUrl, link: link ?? '', order: order ?? 0,
            isActive: isActive ?? true,
        });
        res.status(201).json({ message: 'Tạo banner thành công', bannerId: ref.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** PATCH /api/admin/banners/:bannerId */
const updateBanner = async (req, res) => {
    const ALLOWED = ['title', 'subtitle', 'imageUrl', 'link', 'order', 'isActive'];
    try {
        const update = {};
        for (const key of ALLOWED) {
            if (req.body[key] !== undefined) update[key] = req.body[key];
        }
        await db.collection('banners').doc(req.params.bannerId).update(update);
        res.json({ message: 'Cập nhật banner thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** DELETE /api/admin/banners/:bannerId */
const deleteBanner = async (req, res) => {
    try {
        await db.collection('banners').doc(req.params.bannerId).delete();
        res.json({ message: 'Đã xoá banner' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ══════════════════════════════════════════════════════
//  PT INFO — document: pt_info/main-pt
// ══════════════════════════════════════════════════════

/** GET /api/admin/pt-info */
const getPtInfo = async (req, res) => {
    try {
        const doc = await db.collection('pt_info').doc('main-pt').get();
        if (!doc.exists) return res.status(404).json({ error: 'Chưa có PT info' });
        res.json({ ptInfo: { id: doc.id, ...doc.data() } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** PUT /api/admin/pt-info */
const updatePtInfo = async (req, res) => {
    try {
        await db.collection('pt_info').doc('main-pt').set(req.body, { merge: true });
        res.json({ message: 'Cập nhật PT info thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ══════════════════════════════════════════════════════
//  ZONES — collection: zones
// ══════════════════════════════════════════════════════

/** GET /api/admin/zones */
const getZones = async (req, res) => {
    try {
        const snap  = await db.collection('zones').get();
        const zones = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        res.json({ zones });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** POST /api/admin/zones */
const createZone = async (req, res) => {
    const { name, description, floorId, gymId } = req.body;
    if (!name || !floorId || !gymId) return res.status(400).json({ error: 'Thiếu trường bắt buộc' });
    try {
        const ref = await db.collection('zones').add({ name, description: description ?? '', floorId, gymId });
        res.status(201).json({ message: 'Tạo zone thành công', zoneId: ref.id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** PATCH /api/admin/zones/:zoneId */
const updateZone = async (req, res) => {
    try {
        await db.collection('zones').doc(req.params.zoneId).update(req.body);
        res.json({ message: 'Cập nhật zone thành công' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/** DELETE /api/admin/zones/:zoneId */
const deleteZone = async (req, res) => {
    try {
        await db.collection('zones').doc(req.params.zoneId).delete();
        res.json({ message: 'Đã xoá zone' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getGymInfo, updateGymInfo,
    getGymSetting, updateGymSetting,
    getBanners, createBanner, updateBanner, deleteBanner,
    getPtInfo, updatePtInfo,
    getZones, createZone, updateZone, deleteZone,
};