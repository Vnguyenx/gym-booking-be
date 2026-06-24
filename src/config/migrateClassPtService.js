// scripts/migrateClassPtService.js
const { db } = require('./firebase'); // chỉnh path đúng theo project của bạn

const run = async () => {
    console.log('--- Bắt đầu migration: gán ptServiceId cho classes cũ ---');

    // 1. Lấy toàn bộ pt_services, build map: type -> docId
    const ptServicesSnap = await db.collection('pt_services').get();
    const typeToDocId = {};
    const typeCount = {};

    ptServicesSnap.forEach(doc => {
        const t = doc.data().type;
        typeCount[t] = (typeCount[t] || 0) + 1;
        if (!typeToDocId[t]) typeToDocId[t] = doc.id; // ưu tiên doc đầu tiên gặp
    });

    console.log('Map type -> docId:', typeToDocId);
    Object.entries(typeCount).forEach(([t, count]) => {
        if (count > 1) console.warn(`⚠️ Có ${count} pt_services cùng type="${t}" — cần check lại thủ công`);
    });

    // 2. Quét toàn bộ classes
    const classesSnap = await db.collection('classes').get();
    console.log(`Tổng số classes: ${classesSnap.size}`);

    let updated = 0;
    let skipped = 0;

    for (const doc of classesSnap.docs) {
        const data = doc.data();

        if (data.ptServiceId) {
            skipped++; // đã có ptServiceId rồi, không đụng vào
            continue;
        }

        const matchedId = typeToDocId[data.type];
        if (matchedId) {
            console.log(`Class ${doc.id}: type="${data.type}" -> ptServiceId="${matchedId}"`);
            await doc.ref.update({ ptServiceId: matchedId });
            updated++;
        } else {
            console.warn(`❌ Class ${doc.id}: type="${data.type}" không match được pt_services nào`);
        }
    }

    console.log(`--- Xong. Updated: ${updated}, Skipped (đã có sẵn): ${skipped} ---`);
};

run()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Migration lỗi:', err);
        process.exit(1);
    });