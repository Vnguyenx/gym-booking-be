// seed/seedClasses.js
// Chạy: node seed/seedClasses.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ─── Config ───────────────────────────────────────────────────────────────────

const ADMIN_ID    = '0vRUL6mQLIRSvL14ryl5hLW1sJe2';
const CUSTOMER_ID = '3bGM2nvxyvOPSoxgiufgC7iRGAe2';

// ─── Helper ───────────────────────────────────────────────────────────────────

const d = (dateStr) => new Date(dateStr);

// ─── Data ────────────────────────────────────────────────────────────────────

const CLASSES = [
    // Gói tập không có PT — còn active
    {
        id: 'cls-001',
        customerId:   CUSTOMER_ID,
        type:         'membership_only',
        status:       'active',
        startDate:    d('2026-04-01'),
        endDate:      d('2026-06-30'),
        ptId:         '',
        totalSessions: 30,
        usedSessions:  12,
        createdBy:    ADMIN_ID,
        creatorRole:  'admin',
    },
    // Gói PT coaching — còn active
    {
        id: 'cls-002',
        customerId:   CUSTOMER_ID,
        type:         'pt_coaching',
        status:       'active',
        startDate:    d('2026-04-15'),
        endDate:      d('2026-07-15'),
        ptId:         'pt_vo_thanh_dat',
        totalSessions: 24,
        usedSessions:  8,
        createdBy:    ADMIN_ID,
        creatorRole:  'admin',
    },
    // Gói tập không có PT — đã hết hạn
    {
        id: 'cls-003',
        customerId:   CUSTOMER_ID,
        type:         'membership_only',
        status:       'expired',
        startDate:    d('2026-01-01'),
        endDate:      d('2026-03-31'),
        ptId:         '',
        totalSessions: 30,
        usedSessions:  28,
        createdBy:    ADMIN_ID,
        creatorRole:  'admin',
    },
];

// Attendance cho từng class
const ATTENDANCE = {
    'cls-001': [
        // Có mặt
        { date: d('2026-04-02'), isSuccess: true,  type: 'membership_checkin', customerStatus: 'confirmed', ptStatus: null, secretCodeUsed: 'ABC123' },
        { date: d('2026-04-03'), isSuccess: true,  type: 'membership_checkin', customerStatus: 'confirmed', ptStatus: null, secretCodeUsed: 'DEF456' },
        { date: d('2026-04-05'), isSuccess: true,  type: 'membership_checkin', customerStatus: 'confirmed', ptStatus: null, secretCodeUsed: 'GHI789' },
        // Vắng (isSuccess: null)
        { date: d('2026-04-04'), isSuccess: null,  type: null,                 customerStatus: null,        ptStatus: null, secretCodeUsed: null },
        { date: d('2026-04-06'), isSuccess: null,  type: null,                 customerStatus: null,        ptStatus: null, secretCodeUsed: null },
        // Hôm nay chưa điểm danh
        { date: d('2026-05-13'), isSuccess: null,  type: null,                 customerStatus: null,        ptStatus: null, secretCodeUsed: null },
    ],
    'cls-002': [
        // PT session — đã xác nhận cả 2 phía
        { date: d('2026-04-16'), isSuccess: true,  type: 'pt_session', customerStatus: 'confirmed', ptStatus: 'confirmed', secretCodeUsed: 'JKL012' },
        { date: d('2026-04-18'), isSuccess: true,  type: 'pt_session', customerStatus: 'confirmed', ptStatus: 'confirmed', secretCodeUsed: 'MNO345' },
        { date: d('2026-04-20'), isSuccess: true,  type: 'pt_session', customerStatus: 'confirmed', ptStatus: 'confirmed', secretCodeUsed: 'PQR678' },
        // Customer đã điểm danh, PT chưa xác nhận
        { date: d('2026-05-12'), isSuccess: true,  type: 'pt_session', customerStatus: 'confirmed', ptStatus: 'none',      secretCodeUsed: 'STU901' },
        // Vắng
        { date: d('2026-04-17'), isSuccess: null,  type: null,         customerStatus: null,        ptStatus: null,        secretCodeUsed: null },
        { date: d('2026-04-19'), isSuccess: null,  type: null,         customerStatus: null,        ptStatus: null,        secretCodeUsed: null },
    ],
    'cls-003': [
        { date: d('2026-01-03'), isSuccess: true,  type: 'membership_checkin', customerStatus: 'confirmed', ptStatus: null, secretCodeUsed: 'VWX234' },
        { date: d('2026-01-05'), isSuccess: true,  type: 'membership_checkin', customerStatus: 'confirmed', ptStatus: null, secretCodeUsed: 'YZA567' },
        { date: d('2026-01-07'), isSuccess: null,  type: null,                 customerStatus: null,        ptStatus: null, secretCodeUsed: null },
        { date: d('2026-03-30'), isSuccess: true,  type: 'membership_checkin', customerStatus: 'confirmed', ptStatus: null, secretCodeUsed: 'BCD890' },
        { date: d('2026-03-31'), isSuccess: null,  type: null,                 customerStatus: null,        ptStatus: null, secretCodeUsed: null },
    ],
};

// ─── Seed ────────────────────────────────────────────────────────────────────

const seed = async () => {
    console.log('🌱 Bắt đầu seed classes...');

    for (const cls of CLASSES) {
        const { id, ...data } = cls;
        const classRef = db.collection('classes').doc(id);

        // Tạo document class
        await classRef.set(data);
        console.log(`✅ Tạo class: ${id}`);

        // Tạo subcollection attendance
        const attendance = ATTENDANCE[id] ?? [];
        for (const record of attendance) {
            await classRef.collection('attendance').add(record);
        }
        console.log(`   └── ${attendance.length} attendance records`);
    }

    console.log('\n🎉 Seed hoàn tất!');
    process.exit(0);
};

seed().catch((err) => {
    console.error('❌ Seed thất bại:', err);
    process.exit(1);
});