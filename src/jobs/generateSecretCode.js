const cron = require('node-cron');
const { db } = require('../config/firebase');

const generateCodeLogic = async () => {
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    await db.collection('gym_settings').doc('daily_config').set(
        {
            currentSecretCode: newCode,
            lastUpdated: new Date().toISOString(),
        },
        { merge: true }
    );
    console.log(`✅ Secret code generated: ${newCode}`);
};

const getTodayVN = () => {
    const now = new Date();
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return vnTime.toISOString().split('T')[0];
};

const startGenerateSecretCodeJob = async () => {
    try {
        const doc = await db.collection('gym_settings').doc('daily_config').get();
        const data = doc.data();
        const today = getTodayVN();
        const lastUpdatedDay = data?.lastUpdated
            ? new Date(new Date(data.lastUpdated).getTime() + 7 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0]
            : null;

        if (!data || lastUpdatedDay !== today) {
            console.log(`⚠️ No code for today (${today}), generating...`);
            await generateCodeLogic();
        }
    } catch (err) {
        console.error('Startup check error:', err);
    }

    cron.schedule(
        '0 17 * * *',
        async () => {
            try {
                await generateCodeLogic();
            } catch (err) {
                console.error('Cron job error:', err);
            }
        },
        {
            timezone: 'Asia/Ho_Chi_Minh',
        }
    );
};

module.exports = { startGenerateSecretCodeJob };