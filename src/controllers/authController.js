const { admin, auth, db } = require('../config/firebase');

// POST /api/auth/register
const register = async (req, res) => {
    const { email, password, displayName, phone } = req.body;
    try {
        const userRecord = await auth.createUser({ email, password, displayName });

        await auth.setCustomUserClaims(userRecord.uid, { role: 'customer' });

        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email,
            displayName,
            phone,
            role: 'customer',
            avatarUrl: '',
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// POST /api/auth/login
const login = async (req, res) => {
    const { idToken } = req.body;
    try {
        const decoded = await auth.verifyIdToken(idToken);

        const userDoc = await db.collection('users').doc(decoded.uid).get();
        if (!userDoc.exists)
            return res.status(404).json({ error: 'Không tìm thấy tài khoản' });

        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 ngày
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

        res.cookie('session', sessionCookie, {
            httpOnly: true,
            secure: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: expiresIn,
        });

        res.json({ user: userDoc.data() });
    } catch (err) {
        res.status(401).json({ error: 'Token không hợp lệ' });
    }
};

// POST /api/auth/logout
const logout = (req, res) => {
    res.clearCookie('session', {
        httpOnly: true,
        secure: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });
    res.json({ message: 'Đã đăng xuất' });
};

// GET /api/auth/me
const getMe = async (req, res) => {
    res.json({ user: req.user });
};

module.exports = { register, login, logout, getMe };