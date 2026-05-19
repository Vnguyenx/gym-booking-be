// src/controllers/adminRevenueController.js
//
// Thống kê doanh thu từ collection bookings (status === 'confirmed')
// Không có collection riêng — tính toán trực tiếp từ bookings

const { admin, auth, db } = require('../../config/firebase');

/**
 * GET /api/admin/revenue?month=5&year=2025
 * Tổng doanh thu + danh sách booking đã thanh toán trong tháng
 */
const getRevenue = async (req, res) => {
    try {
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year  = parseInt(req.query.year)  || new Date().getFullYear();

        // Lấy tất cả booking confirmed
        const snap = await db.collection('bookings')
            .where('status', '==', 'confirmed')
            .orderBy('paidAt', 'desc')
            .get();

        // Lọc theo tháng/năm của paidAt trên FE vì Firestore không filter date range dễ
        const allConfirmed = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        const inMonth = allConfirmed.filter(b => {
            if (!b.paidAt) return false;
            const d = new Date(b.paidAt);
            return d.getMonth() + 1 === month && d.getFullYear() === year;
        });

        const totalRevenue = inMonth.reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);

        // Doanh thu theo ngày — cho biểu đồ
        const byDay = {};
        for (const b of inMonth) {
            const day = new Date(b.paidAt).getDate();
            byDay[day] = (byDay[day] ?? 0) + b.totalPrice;
        }

        res.json({
            month, year,
            totalRevenue,
            count:    inMonth.length,
            byDay,              // { 1: 500000, 5: 1200000, ... }
            bookings: inMonth,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/admin/revenue/summary
 * Tổng quan: doanh thu 6 tháng gần nhất (cho chart tổng quan dashboard)
 */
const getRevenueSummary = async (req, res) => {
    try {
        const snap = await db.collection('bookings')
            .where('status', '==', 'confirmed')
            .get();

        const now       = new Date();
        const summary   = {};

        // Khởi tạo 6 tháng gần nhất
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            summary[key] = 0;
        }

        for (const doc of snap.docs) {
            const data = doc.data();
            if (!data.paidAt) continue;
            const d   = new Date(data.paidAt);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (summary[key] !== undefined) {
                summary[key] += data.totalPrice ?? 0;
            }
        }

        res.json({ summary }); // { "2025-01": 5000000, "2025-02": 3200000, ... }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getRevenue, getRevenueSummary };