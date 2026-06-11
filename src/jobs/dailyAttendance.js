const cron = require('node-cron');
const { db } = require('../config/firebase');

const getVNTimeString = () => {
    return new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
};

const startDailyAttendanceJob = () => {
    cron.schedule(
        '59 23 * * *',
        async () => {
            console.log(`[${getVNTimeString()}] --- Running Daily Attendance Check (23:59) ---`);
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStart = today.toISOString();

                const activeClasses = await db.collection('classes')
                    .where('status', '==', 'active')
                    .get();

                if (activeClasses.empty) {
                    console.log(`[${getVNTimeString()}] No active classes found.`);
                    return;
                }

                const batch = db.batch();
                let recordsCreated = 0;

                for (const classDoc of activeClasses.docs) {
                    const classRef = classDoc.ref;
                    const classData = classDoc.data();

                    const todayAttendance = await classRef.collection('attendance')
                        .where('date', '>=', todayStart)
                        .get();

                    if (todayAttendance.empty) {
                        const newAttRef = classRef.collection('attendance').doc();
                        batch.set(newAttRef, {
                            date: new Date().toISOString(),
                            isSuccess: null,
                            type: null,
                            customerStatus: null,
                            ptStatus: null,
                            secretCodeUsed: null
                        });

                        const currentUsed = classData.usedSessions ?? 0;
                        batch.update(classRef, {
                            usedSessions: currentUsed + 1
                        });

                        recordsCreated++;
                    }
                }

                await batch.commit();
                console.log(`[${getVNTimeString()}] --- Daily Job Completed: ${recordsCreated} absent records created ---`);
            } catch (error) {
                console.error(`[${getVNTimeString()}] Daily Job Error:`, error);
            }
        },
        {
            timezone: 'Asia/Ho_Chi_Minh',
        }
    );
};

module.exports = { startDailyAttendanceJob };