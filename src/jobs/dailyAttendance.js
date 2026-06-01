const cron = require('node-cron');
const { db } = require('../config/firebase');

const startDailyAttendanceJob = () => {
    // Chạy vào 23:59 mỗi ngày
    cron.schedule('59 23 * * *', async () => {
        console.log('--- Running Daily Attendance Check (23:59) ---');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStart = today.toISOString();

            // 1. Lấy tất cả lớp đang active
            const activeClasses = await db.collection('classes')
                .where('status', '==', 'active')
                .get();

            if (activeClasses.empty) {
                console.log('No active classes found.');
                return;
            }

            const batch = db.batch();
            let recordsCreated = 0;

            for (const classDoc of activeClasses.docs) {
                const classRef = classDoc.ref;
                const classData = classDoc.data();

                // 2. Kiểm tra sub-collection attendance của RIÊNG lớp này hôm nay
                const todayAttendance = await classRef.collection('attendance')
                    .where('date', '>=', todayStart)
                    .get();

                // 3. Nếu chưa có record nào hôm nay → tạo record vắng + tăng usedSessions
                if (todayAttendance.empty) {
                    // Tạo attendance record đánh dấu vắng
                    const newAttRef = classRef.collection('attendance').doc();
                    batch.set(newAttRef, {
                        date: new Date().toISOString(),
                        isSuccess: null,       // null = vắng/chưa điểm danh
                        type: null,
                        customerStatus: null,
                        ptStatus: null,
                        secretCodeUsed: null
                    });

                    // Tăng usedSessions lên 1
                    const currentUsed = classData.usedSessions ?? 0;
                    batch.update(classRef, {
                        usedSessions: currentUsed + 1
                    });

                    recordsCreated++;
                }
            }

            await batch.commit();
            console.log(`--- Daily Job Completed: ${recordsCreated} absent records created ---`);
        } catch (error) {
            console.error('Daily Job Error:', error);
        }
    });
};

module.exports = { startDailyAttendanceJob };