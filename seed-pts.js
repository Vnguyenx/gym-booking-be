/**
 * seed-pts.js
 * ─────────────────────────────────────────────────────────────────
 * Script tạo 13 tài khoản PT vào 2 collection: users và pts
 *
 * QUY TẮC:
 *  - id document của pts == id document của users (== uid)
 *  - Dùng uid tự sinh để nhất quán giữa 2 collection
 *  - Chạy 1 lần duy nhất: node seed-pts.js
 * ─────────────────────────────────────────────────────────────────
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ── Danh sách 13 PT ──────────────────────────────────────────────
// Mỗi object gồm: thông tin cho users + thông tin cho pts
// id: dùng làm document ID cho cả 2 collection
const PT_DATA = [
    {
        // ── Thông tin đăng nhập (users) ──
        id:          'pt_nguyen_minh_tuan',
        displayName: 'Nguyễn Minh Tuấn',
        email:       'tuan.nguyen@gymxyz.vn',
        phone:       '0901234567',
        role:        'pt',
        avatarUrl:   '',

        // ── Hồ sơ PT (pts) ──
        fullName:    'Nguyễn Minh Tuấn',
        bio:         'HLV chuyên tăng cơ giảm mỡ, 7 năm kinh nghiệm huấn luyện cho vận động viên và người tập phổ thông.',
        experience:  '7 năm kinh nghiệm',
        specialty:   ['Tăng cơ', 'Giảm mỡ', 'Powerlifting'],
        isAvailable: true,
        avatar:      '',
    },
    {
        id:          'pt_tran_thi_lan',
        displayName: 'Trần Thị Lan',
        email:       'lan.tran@gymxyz.vn',
        phone:       '0912345678',
        role:        'pt',
        avatarUrl:   '',

        fullName:    'Trần Thị Lan',
        bio:         'Chuyên gia Yoga và Pilates, từng đạt giải nhất giải thể dục thẩm mỹ toàn quốc năm 2022.',
        experience:  '5 năm kinh nghiệm',
        specialty:   ['Yoga', 'Pilates', 'Thể dục thẩm mỹ'],
        isAvailable: true,
        avatar:      '',
    },
    {
        id:          'pt_le_hoang_phuc',
        displayName: 'Lê Hoàng Phúc',
        email:       'phuc.le@gymxyz.vn',
        phone:       '0923456789',
        role:        'pt',
        avatarUrl:   '',

        fullName:    'Lê Hoàng Phúc',
        bio:         'Cựu vận động viên cử tạ quốc gia, chuyên huấn luyện Squat - Deadlift - Bench Press cho người mới.',
        experience:  '6 năm kinh nghiệm',
        specialty:   ['Powerlifting', 'Squat & Deadlift', 'Sức mạnh nền'],
        isAvailable: true,
        avatar:      '',
    },
    {
        id:          'pt_pham_thi_huong',
        displayName: 'Phạm Thị Hương',
        email:       'huong.pham@gymxyz.vn',
        phone:       '0934567890',
        role:        'pt',
        avatarUrl:   '',

        fullName:    'Phạm Thị Hương',
        bio:         'HLV dinh dưỡng thể thao, kết hợp tập luyện và chế độ ăn khoa học giúp đạt mục tiêu nhanh nhất.',
        experience:  '4 năm kinh nghiệm',
        specialty:   ['Dinh dưỡng thể thao', 'Giảm mỡ', 'Tập cho người béo phì'],
        isAvailable: true,
        avatar:      '',
    },
    {
        id:          'pt_vo_thanh_dat',
        displayName: 'Võ Thành Đạt',
        email:       'dat.vo@gymxyz.vn',
        phone:       '0945678901',
        role:        'pt',
        avatarUrl:   '',

        fullName:    'Võ Thành Đạt',
        bio:         'Chuyên gia Functional Training và HIIT, thiết kế giáo án tùy chỉnh cho từng mục tiêu cá nhân.',
        experience:  '5 năm kinh nghiệm',
        specialty:   ['HIIT', 'Functional Training', 'Cardio'],
        isAvailable: true,
        avatar:      '',
    },
    {
        id:          'pt_nguyen_thi_mai',
        displayName: 'Nguyễn Thị Mai',
        email:       'mai.nguyen@gymxyz.vn',
        phone:       '0956789012',
        role:        'pt',
        avatarUrl:   '',

        fullName:    'Nguyễn Thị Mai',
        bio:         'HLV chuyên Zumba và aerobic, tạo không khí vui vẻ và năng động cho mọi buổi tập nhóm.',
        experience:  '3 năm kinh nghiệm',
        specialty:   ['Zumba', 'Aerobic', 'Tập nhóm'],
        isAvailable: true,
        avatar:      '',
    },
    {
        id:          'pt_dang_van_khai',
        displayName: 'Đặng Văn Khải',
        email:       'khai.dang@gymxyz.vn',
        phone:       '0967890123',
        role:        'pt',
        avatarUrl:   '',

        fullName:    'Đặng Văn Khải',
        bio:         'Cựu võ sĩ MMA, kết hợp võ thuật và gym để xây dựng thể lực toàn diện cho học viên.',
        experience:  '8 năm kinh nghiệm',
        specialty:   ['MMA', 'Boxing', 'Thể lực toàn diện'],
        isAvailable: false, // Đang nghỉ phép
        avatar:      '',
    },
    {
        id:          'pt_bui_thi_thu',
        displayName: 'Bùi Thị Thu',
        email:       'thu.bui@gymxyz.vn',
        phone:       '0978901234',
        role:        'pt',
        avatarUrl:   '',

        fullName:    'Bùi Thị Thu',
        bio:         'Chuyên gia phục hồi chức năng, hỗ trợ người sau chấn thương quay lại tập luyện an toàn.',
        experience:  '6 năm kinh nghiệm',
        specialty:   ['Phục hồi chức năng', 'Chấn thương thể thao', 'Yoga trị liệu'],
        isAvailable: true,
        avatar:      '',
    },
    {
        id:          'pt_hoang_duc_anh',
        displayName: 'Hoàng Đức Anh',
        email:       'anh.hoang@gymxyz.vn',
        phone:       '0989012345',
        role:        'pt',
        avatarUrl:   '',

        fullName:    'Hoàng Đức Anh',
        bio:         'HLV chuyên tăng cơ cho nam, xây dựng giáo án 12 tuần tùy theo thể trạng và mục tiêu cụ thể.',
        experience:  '5 năm kinh nghiệm',
        specialty:   ['Tăng cơ', 'Bodybuilding', 'Dinh dưỡng tăng khối'],
        isAvailable: true,
        avatar:      '',
    },
    {
        id:          'pt_ly_thi_kim_chi',
        displayName: 'Lý Thị Kim Chi',
        email:       'chi.ly@gymxyz.vn',
        phone:       '0990123456',
        role:        'pt',
        avatarUrl:   '',

        fullName:    'Lý Thị Kim Chi',
        bio:         'Chuyên gia tập luyện cho phụ nữ sau sinh, hỗ trợ lấy lại vóc dáng an toàn và hiệu quả.',
        experience:  '4 năm kinh nghiệm',
        specialty:   ['Tập sau sinh', 'Giảm mỡ bụng', 'Core & Mông'],
        isAvailable: true,
        avatar:      '',
    },
    {
        id:          'pt_tran_van_hung',
        displayName: 'Trần Văn Hùng',
        email:       'hung.tran@gymxyz.vn',
        phone:       '0901122334',
        role:        'pt',
        avatarUrl:   '',

        fullName:    'Trần Văn Hùng',
        bio:         'HLV thể hình thi đấu, từng đạt top 3 giải thể hình miền Nam 2023, chuyên dạy bodybuilding nâng cao.',
        experience:  '9 năm kinh nghiệm',
        specialty:   ['Bodybuilding thi đấu', 'Cutting', 'Tăng cơ nâng cao'],
        isAvailable: true,
        avatar:      '',
    },
    {
        id:          'pt_nguyen_thi_bich_ngoc',
        displayName: 'Nguyễn Thị Bích Ngọc',
        email:       'ngoc.nguyen@gymxyz.vn',
        phone:       '0912233445',
        role:        'pt',
        avatarUrl:   '',

        fullName:    'Nguyễn Thị Bích Ngọc',
        bio:         'Chuyên gia Stretching và Flexibility, giúp cải thiện biên độ vận động và giảm đau mỏi cơ thể.',
        experience:  '3 năm kinh nghiệm',
        specialty:   ['Stretching', 'Flexibility', 'Phòng ngừa chấn thương'],
        isAvailable: true,
        avatar:      '',
    },
    {
        id:          'pt_do_quoc_bao',
        displayName: 'Đỗ Quốc Bảo',
        email:       'bao.do@gymxyz.vn',
        phone:       '0923344556',
        role:        'pt',
        avatarUrl:   '',

        fullName:    'Đỗ Quốc Bảo',
        bio:         'HLV Crossfit và Calisthenics, chuyên xây dựng sức mạnh toàn thân không cần máy móc phức tạp.',
        experience:  '6 năm kinh nghiệm',
        specialty:   ['Crossfit', 'Calisthenics', 'Street Workout'],
        isAvailable: false, // Đang nghỉ
        avatar:      '',
    },
];

// ── Hàm seed chính ───────────────────────────────────────────────
const seedPTs = async () => {
    console.log('🚀 Bắt đầu seed 13 PT vào Firestore...\n');

    // Dùng batch write để ghi nhiều document cùng lúc (hiệu quả hơn)
    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    for (const pt of PT_DATA) {
        // ── 1. Tạo document trong collection users ──
        const userRef = db.collection('users').doc(pt.id);
        batch.set(userRef, {
            uid:         pt.id,
            displayName: pt.displayName,
            email:       pt.email,
            phone:       pt.phone,
            role:        pt.role,         // "pt"
            avatarUrl:   pt.avatarUrl,
            createdAt:   now,
        });

        // ── 2. Tạo document trong collection pts (cùng ID) ──
        const ptRef = db.collection('pts').doc(pt.id);
        batch.set(ptRef, {
            fullName:    pt.fullName,
            bio:         pt.bio,
            experience:  pt.experience,
            specialty:   pt.specialty,    // array
            isAvailable: pt.isAvailable,
            avatar:      pt.avatar,
            createdAt:   now,
            updateAt:    now,
        });

        console.log(`  ✅ Chuẩn bị: ${pt.displayName} (${pt.id})`);
    }

    // Ghi tất cả vào Firestore trong 1 lần
    await batch.commit();

    console.log(`\n✅ Đã seed thành công ${PT_DATA.length} PT vào 2 collection!`);
    console.log('   - users: ' + PT_DATA.length + ' documents mới');
    console.log('   - pts:   ' + PT_DATA.length + ' documents mới');
    console.log('\n📌 Lưu ý: Cần vào Firebase Auth để tạo tài khoản đăng nhập riêng nếu cần test login.');

    process.exit(0);
};

// Chạy seed
seedPTs().catch(err => {
    console.error('\n❌ Lỗi khi seed:', err);
    process.exit(1);
});