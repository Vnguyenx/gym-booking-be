// src/controllers/adminRevenueController.js
const { db } = require('../../config/firebase');

const convertTimestamps = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
        result[key] = val?.toDate ? val.toDate().toISOString() : val;
    }
    return result;
};

// Helper để enrich booking với thông tin tên
const enrichBooking = async (booking) => {
    let customerName = '', customerPhone = '';
    if (booking.customerId) {
        const userDoc = await db.collection('users').doc(booking.customerId).get();
        if (userDoc.exists) {
            customerName = userDoc.data().displayName || userDoc.data().fullName || '';
            customerPhone = userDoc.data().phone || userDoc.data().phoneNumber || '';
        }
    }
    let membershipName = '';
    if (booking.membershipId) {
        const memDoc = await db.collection('memberships').doc(booking.membershipId).get();
        membershipName = memDoc.exists ? memDoc.data().name : booking.membershipId;
    }
    let ptServiceName = '';
    if (booking.ptServiceId && booking.ptServiceId !== 'pt-none') {
        const ptServDoc = await db.collection('pt_services').doc(booking.ptServiceId).get();
        ptServiceName = ptServDoc.exists ? ptServDoc.data().name : booking.ptServiceId;
    } else if (booking.ptServiceId === 'pt-none') {
        ptServiceName = 'Tự tập (Không PT)';
    }
    let ptName = '';
    if (booking.ptId && booking.ptId !== '') {
        const ptDoc = await db.collection('pts').doc(booking.ptId).get();
        ptName = ptDoc.exists ? ptDoc.data().fullName : '';
    }
    return {
        ...convertTimestamps(booking),
        id: booking.id,
        customerName,
        customerPhone,
        membershipName,
        ptServiceName,
        ptName,
    };
};
/**
 * GET /api/admin/revenue?month=5&year=2025
 */
const getRevenue = async (req, res) => {
    try {
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year  = parseInt(req.query.year)  || new Date().getFullYear();

        const snap = await db.collection('bookings')
            .where('status', '==', 'confirmed')
            .orderBy('paidAt', 'desc')
            .get();

        const allConfirmed = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const inMonth = allConfirmed.filter(b => {
            if (!b.paidAt) return false;
            const d = new Date(b.paidAt);
            return d.getMonth() + 1 === month && d.getFullYear() === year;
        });

        const totalRevenue = inMonth.reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);
        const byDay = {};
        for (const b of inMonth) {
            const day = new Date(b.paidAt).getDate();
            byDay[day] = (byDay[day] ?? 0) + b.totalPrice;
        }

        // Enrich từng booking
        const enrichedBookings = await Promise.all(inMonth.map(b => enrichBooking(b, b.id)));

        res.json({
            month, year,
            totalRevenue,
            count: inMonth.length,
            byDay,
            bookings: enrichedBookings,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/admin/revenue/summary
 */
const getRevenueSummary = async (req, res) => {
    try {
        const snap = await db.collection('bookings')
            .where('status', '==', 'confirmed')
            .get();

        const now       = new Date();
        const summary   = {};

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
        res.json({ summary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/admin/revenue/year?year=2025
 */
const getRevenueByYear = async (req, res) => {
    try {
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const snap = await db.collection('bookings')
            .where('status', '==', 'confirmed')
            .get();

        const monthlyRevenue = {};
        for (let i = 1; i <= 12; i++) monthlyRevenue[i] = 0;

        for (const doc of snap.docs) {
            const data = doc.data();
            if (!data.paidAt) continue;
            const d = new Date(data.paidAt);
            if (d.getFullYear() === year) {
                const month = d.getMonth() + 1;
                monthlyRevenue[month] += data.totalPrice ?? 0;
            }
        }
        res.json({ year, monthlyRevenue });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/admin/revenue/week?week=23&year=2025
 */
const getRevenueByWeek = async (req, res) => {
    try {
        let week = parseInt(req.query.week);
        let year = parseInt(req.query.year) || new Date().getFullYear();

        const firstDayOfYear = new Date(year, 0, 1);
        const daysOffset = (week - 1) * 7;
        const startDate = new Date(firstDayOfYear);
        startDate.setDate(firstDayOfYear.getDate() + daysOffset);
        const dayOfWeek = startDate.getDay();
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate.setDate(startDate.getDate() + diff);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);

        const snap = await db.collection('bookings')
            .where('status', '==', 'confirmed')
            .get();

        const dailyRevenue = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            const key = d.toISOString().slice(0, 10);
            dailyRevenue[key] = 0;
        }

        for (const doc of snap.docs) {
            const data = doc.data();
            if (!data.paidAt) continue;
            const paidDate = new Date(data.paidAt);
            if (paidDate >= startDate && paidDate <= endDate) {
                const key = paidDate.toISOString().slice(0, 10);
                dailyRevenue[key] = (dailyRevenue[key] || 0) + (data.totalPrice ?? 0);
            }
        }
        res.json({ week, year, startDate: startDate.toISOString(), endDate: endDate.toISOString(), dailyRevenue });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/admin/revenue/range?start=2025-01-01&end=2025-12-31
 */
const getRevenueByRange = async (req, res) => {
    try {
        let start = req.query.start ? new Date(req.query.start) : new Date();
        let end = req.query.end ? new Date(req.query.end) : new Date();
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const snap = await db.collection('bookings')
            .where('status', '==', 'confirmed')
            .get();

        const bookingsInRange = [];
        for (const doc of snap.docs) {
            const data = doc.data();
            if (!data.paidAt) continue;
            const paidDate = new Date(data.paidAt);
            if (paidDate >= start && paidDate <= end) {
                bookingsInRange.push({ id: doc.id, ...data });
            }
        }
        const total = bookingsInRange.reduce((sum, b) => sum + (b.totalPrice ?? 0), 0);
        // Enrich từng booking
        const enriched = await Promise.all(bookingsInRange.map(b => enrichBooking(b, b.id)));

        res.json({ start: start.toISOString(), end: end.toISOString(), totalRevenue: total, count: bookingsInRange.length, bookings: enriched });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = { getRevenue, getRevenueSummary, getRevenueByYear, getRevenueByWeek, getRevenueByRange };