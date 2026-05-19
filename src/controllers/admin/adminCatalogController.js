// src/controllers/adminCatalogController.js
//
// Quản lý danh mục:
//   memberships, pt_services, equipment

const { admin, auth, db } = require('../../config/firebase');


// ══════════════════════════════════════════════════════
//  MEMBERSHIPS
// ══════════════════════════════════════════════════════

const getMemberships = async (req, res) => {
    try {
        const snap = await db.collection('memberships').orderBy('durationMonths').get();
        res.json({ memberships: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const createMembership = async (req, res) => {
    const { name, durationMonths, price, priceOnline, note, isPopular, promotions } = req.body;
    if (!name || !durationMonths || !price) return res.status(400).json({ error: 'Thiếu trường bắt buộc' });
    try {
        const ref = await db.collection('memberships').add({
            name, durationMonths, price, priceOnline: priceOnline ?? price,
            note: note ?? '', isPopular: isPopular ?? false, promotions: promotions ?? [],
        });
        res.status(201).json({ message: 'Tạo gói tập thành công', membershipId: ref.id });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateMembership = async (req, res) => {
    try {
        await db.collection('memberships').doc(req.params.id).update(req.body);
        res.json({ message: 'Cập nhật gói tập thành công' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteMembership = async (req, res) => {
    try {
        await db.collection('memberships').doc(req.params.id).delete();
        res.json({ message: 'Đã xoá gói tập' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// ══════════════════════════════════════════════════════
//  PT SERVICES
// ══════════════════════════════════════════════════════

const getPTServices = async (req, res) => {
    try {
        const snap = await db.collection('pt_services').get();
        res.json({ ptServices: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const updatePTService = async (req, res) => {
    try {
        await db.collection('pt_services').doc(req.params.id).update(req.body);
        res.json({ message: 'Cập nhật dịch vụ PT thành công' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

// ══════════════════════════════════════════════════════
//  EQUIPMENT
// ══════════════════════════════════════════════════════

const getEquipments = async (req, res) => {
    try {
        const { zoneId, floorId } = req.query;
        let query = db.collection('equipment');
        if (zoneId)  query = query.where('zoneId', '==', zoneId);
        if (floorId) query = query.where('floorId', '==', floorId);
        const snap = await query.get();
        res.json({ equipment: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const createEquipment = async (req, res) => {
    const required = ['name', 'nameVi', 'category', 'floorId', 'zoneId', 'gymId'];
    for (const f of required) {
        if (!req.body[f]) return res.status(400).json({ error: `Thiếu trường ${f}` });
    }
    try {
        const ref = await db.collection('equipment').add({
            ...req.body,
            isActive:    req.body.isActive    ?? true,
            quantity:    req.body.quantity    ?? 1,
            imageUrls:   req.body.imageUrls   ?? [],
            muscleGroups:req.body.muscleGroups?? [],
            updatedAt:   new Date(),
        });
        res.status(201).json({ message: 'Tạo thiết bị thành công', equipmentId: ref.id });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const updateEquipment = async (req, res) => {
    try {
        await db.collection('equipment').doc(req.params.id).update({
            ...req.body, updatedAt: new Date(),
        });
        res.json({ message: 'Cập nhật thiết bị thành công' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

const deleteEquipment = async (req, res) => {
    try {
        await db.collection('equipment').doc(req.params.id).delete();
        res.json({ message: 'Đã xoá thiết bị' });
    } catch (err) { res.status(500).json({ error: err.message }); }
};

module.exports = {
    getMemberships, createMembership, updateMembership, deleteMembership,
    getPTServices, updatePTService,
    getEquipments, createEquipment, updateEquipment, deleteEquipment,
};