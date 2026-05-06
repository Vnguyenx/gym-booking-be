const { auth, db } = require('../config/firebase');

const verifySession = async (req, res, next) => {
    const sessionCookie = req.cookies?.session;
    if (!sessionCookie)
        return res.status(401).json({ error: 'Chưa đăng nhập' });

    try {
        const decoded = await auth.verifySessionCookie(sessionCookie, true);
        const userDoc = await db.collection('users').doc(decoded.uid).get();
        req.user = userDoc.data();
        next();
    } catch {
        res.clearCookie('session');
        res.status(401).json({ error: 'Session - phiên làm việc hết hạn, vui lòng đăng nhập lại' });
    }
};

module.exports = verifySession;