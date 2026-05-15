// middlewares/requireRole.js
// Dùng SAU verifySession — req.user.role đã có sẵn
// Cách dùng:
//   requireRole('pt')               → chỉ PT
//   requireRole('admin')            → chỉ admin
//   requireRole('admin', 'pt')      → admin hoặc PT đều được

const requireRole = (...roles) => {
    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole || !roles.includes(userRole)) {
            return res.status(403).json({
                error: 'Bạn không có quyền truy cập tính năng này',
            });
        }

        next();
    };
};

module.exports = requireRole;