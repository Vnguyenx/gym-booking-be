const cron = require('node-cron');
const { db } = require('../config/firebase');

const startDailyAttendanceJob = () => {
    // Chạy vào 23:59 mỗi ngày
    cron.schedule('59 23 * * *', async () => {
        console.log('--- Running Daily Attendance Check (23:59) ---');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayStr = today.toISOString().split('T')[0];

            // 1. Lấy tất cả lớp học đang Active
            const activeClasses = await db.collection('classes')
                .where('status', '==', 'active')
                .get();

            const batch = db.batch();

            for (const doc of activeClasses.docs) {
                const classRef = doc.ref;

                // Quét tất cả attendance của TẤT CẢ các lớp cùng lúc
                const allAttendanceToday = await db.collectionGroup('attendance')
                    .where('date', '>=', today.toISOString())
                    .get();

                if (allAttendanceToday.empty) {
                    // Nếu chưa có bất kỳ record nào -> Tạo record vắng (isSuccess: null)
                    const newAttRef = classRef.collection('attendance').doc();
                    batch.set(newAttRef, {
                        date: new Date().toISOString(),
                        isSuccess: null, // Đánh dấu vắng/chưa điểm danh
                        type: null,
                        customerStatus: null,
                        ptStatus: null,
                        secretCodeUsed: null
                    });
                }
            }
            await batch.commit();
            console.log('--- Daily Job Completed Successfully ---');
        } catch (error) {
            console.error('Daily Job Error:', error);
        }
    });

    // Bonus: Job tạo Secret Code mới vào 00:00 hàng ngày
    cron.schedule('0 0 * * *', async () => {
        const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        await db.collection('gym_settings').doc('daily_config').set({
            currentSecretCode: newCode,
            lastUpdated: new Date().toISOString()
        });
        console.log('Generated new secret code for today:', newCode);
    });
};

module.exports = { startDailyAttendanceJob };