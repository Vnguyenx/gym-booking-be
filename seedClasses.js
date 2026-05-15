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
const PT_ID       = 'pt_vo_thanh_dat';
const GROUP_ID    = 'group-sang-thu-4-6';

const d = (dateStr) => new Date(dateStr);

// ─── Data ────────────────────────────────────────────────────────────────────

const CLASSES = [
    {
        id: 'cls-004',
        customerId:    CUSTOMER_ID,
        type:          'pt-group',
        classGroupId:  GROUP_ID,
        status:        'active',
        startDate:     d('2026-05-01'),
        endDate:       d('2026-07-31'),
        ptId:          PT_ID,
        totalSessions: 20,
        usedSessions:  3,
        createdBy:     ADMIN_ID,
        creatorRole:   'admin',
    },
    {
        id: 'cls-005',
        customerId:    CUSTOMER_ID + '_member2',   // ← thay bằng uid thật
        type:          'pt-group',
        classGroupId:  GROUP_ID,
        status:        'active',
        startDate:     d('2026-05-01'),
        endDate:       d('2026-07-31'),
        ptId:          PT_ID,
        totalSessions: 20,
        usedSessions:  3,
        createdBy:     ADMIN_ID,
        creatorRole:   'admin',
    },
];

const ATTENDANCE = {
    'cls-004': [
        { date: d('2026-05-02'), isSuccess: true,  type: 'pt_session', customerStatus: 'confirmed', ptStatus: 'confirmed', secretCodeUsed: 'GRP001' },
        { date: d('2026-05-05'), isSuccess: true,  type: 'pt_session', customerStatus: 'confirmed', ptStatus: 'confirmed', secretCodeUsed: 'GRP002' },
        { date: d('2026-05-09'), isSuccess: true,  type: 'pt_session', customerStatus: 'confirmed', ptStatus: 'none',      secretCodeUsed: 'GRP003' },
        { date: d('2026-05-07'), isSuccess: null,  type: null,         customerStatus: null,        ptStatus: null,        secretCodeUsed: null },
        { date: d('2026-05-14'), isSuccess: null,  type: null,         customerStatus: null,        ptStatus: null,        secretCodeUsed: null },
    ],
    'cls-005': [
        { date: d('2026-05-02'), isSuccess: true,  type: 'pt_session', customerStatus: 'confirmed', ptStatus: 'confirmed', secretCodeUsed: 'GRP001' },
        { date: d('2026-05-05'), isSuccess: true,  type: 'pt_session', customerStatus: 'confirmed', ptStatus: 'confirmed', secretCodeUsed: 'GRP002' },
        { date: d('2026-05-09'), isSuccess: null,  type: null,         customerStatus: null,        ptStatus: null,        secretCodeUsed: null },   // member 2 vắng
        { date: d('2026-05-07'), isSuccess: null,  type: null,         customerStatus: null,        ptStatus: null,        secretCodeUsed: null },
        { date: d('2026-05-14'), isSuccess: null,  type: null,         customerStatus: null,        ptStatus: null,        secretCodeUsed: null },
    ],
};

// ─── Seed ────────────────────────────────────────────────────────────────────

const seed = async () => {
    console.log('🌱 Seed cls-004 và cls-005...');

    for (const cls of CLASSES) {
        const { id, ...data } = cls;
        const classRef = db.collection('classes').doc(id);

        await classRef.set(data);
        console.log(`✅ ${id}  [group: ${data.classGroupId}]`);

        const attendance = ATTENDANCE[id] ?? [];
        for (const record of attendance) {
            await classRef.collection('attendance').add(record);
        }
        console.log(`   └── ${attendance.length} attendance records`);
    }

    console.log('\n🎉 Xong!');
    process.exit(0);
};

seed().catch((err) => {
    console.error('❌ Thất bại:', err);
    process.exit(1);
});