// server.js
// Đây là file khởi động server — điểm vào của toàn bộ Backend
// Chỉ làm 1 việc: lắng nghe cổng và khởi động app

require('dotenv').config(); // Phải là dòng đầu tiên
const app = require('./src/app'); // hoặc express, etc.

// Lấy PORT từ .env, nếu không có thì dùng 5000
const PORT = process.env.PORT || 5000;

// Bắt đầu lắng nghe request từ client
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});