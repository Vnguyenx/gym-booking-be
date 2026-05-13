const cron = require('node-cron');
const { db } = require('../config/firebase');

/**
 * Job tự động sinh mã bí mật (6 ký tự) vào 00:00 hàng ngày.
 * Lưu vào gym_settings/daily_config để customer dùng điểm danh.
 */
const startGenerateSecretCodeJob = () => {
    // 00:00 mỗi ngày
    cron.schedule('0 0 * * *', async () => {
        console.log('--- Running Secret Code Generator (00:00) ---');
        try {
            // Tạo mã ngẫu nhiên 6 ký tự (Ví dụ: A1B2C3)
            const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();

            await db.collection('gym_settings').doc('daily_config').set({
                currentSecretCode: newCode,
                lastUpdated: new Date().toISOString()
            });

            console.log(`✅ Generated new secret code for today: ${newCode}`);
        } catch (error) {
            console.error('❌ Secret Code Job Error:', error);
        }
    });
};

module.exports = { startGenerateSecretCodeJob };