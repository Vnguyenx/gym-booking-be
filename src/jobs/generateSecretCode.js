const cron = require('node-cron');
const { db } = require('../config/firebase');

const generateCodeLogic = async () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    await db.collection('gym_settings').doc('daily_config').set({
        currentSecretCode: newCode,
        lastUpdated: new Date().toISOString()
    });
    console.log('✅ Generated new secret code:', newCode);
};

const startGenerateSecretCodeJob = async () => {
    // 1. KIỂM TRA NGAY KHI KHỞI ĐỘNG (Startup Check)
    const doc = await db.collection('gym_settings').doc('daily_config').get();
    const data = doc.data();
    const today = new Date().toISOString().split('T')[0];

    // Nếu chưa có data hoặc ngày cập nhật cuối cùng không phải hôm nay
    if (!data || !data.lastUpdated.startsWith(today)) {
        console.log('⚠️ Detect missing code for today. Generating now...');
        await generateCodeLogic();
    }

    // 2. LÊN LỊCH CHẠY ĐỊNH KỲ (Cron Job)
    cron.schedule('0 0 * * *', async () => {
        console.log('--- Running Secret Code Generator (00:00) ---');
        await generateCodeLogic();
    });
};

module.exports = { startGenerateSecretCodeJob };