const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();

// Logic phân tầng:
// - Mọi gói đều có: toàn bộ máy tập, check-in unlimited, thư viện bài tập, lớp học nhóm, máy lọc nước, tủ đồ có khoá
// - Promotions chỉ ghi những thứ KHÁC BIỆT so với gói thấp hơn
// - Giới thiệu bạn: bạn đóng ~70% giá/tháng của gói tương ứng (làm tròn)
//   24m: 229k/tháng → bạn đóng ~160k/tháng × 24 = 3.840.000đ
//   60m: 200k/tháng → bạn đóng ~140k/tháng × 60 = 8.400.000đ

const memberships = [
  {
    id: "mem-1m",
    durationMonths: 1,
    name: "Gói tập 1 tháng",
    price: 350000,
    priceOnline: 280000,
    note: "350K/tháng",
    isPopular: false,
    promotions: [
      "Toàn bộ máy tập & khu vực tập",
      "Check-in không giới hạn",
      "Tủ đồ có khoá & máy lọc nước miễn phí",
      "Nhà vệ sinh / phòng tắm và nơi gửi xe miễn phí"
    ]
  },
  {
    id: "mem-3m",
    durationMonths: 3,
    name: "Gói tập 3 tháng",
    price: 990000,
    priceOnline: 792000,
    note: "330K/tháng",
    isPopular: true,
    promotions: [
      "Tất cả quyền lợi gói 1 tháng",
      "Tặng 5 ngày trải nghiệm",
      "tư vấn dinh dưỡng / đo body miễn phí (3 lần)"
    ]
  },
  {
    id: "mem-6m",
    durationMonths: 6,
    name: "Gói tập 6 tháng",
    price: 1690000,
    priceOnline: 1350000,
    note: "282K/tháng",
    isPopular: false,
    promotions: [
      "Tất cả quyền lợi gói 3 tháng",
      "Tiết kiệm 48K mỗi tháng so với gói 3 tháng",
      "3 buổi tư vấn PT miễn phí",
      "Hỗ trợ qua Zalo trong giờ hành chính"
    ]
  },
  {
    id: "mem-12m",
    durationMonths: 12,
    name: "Gói tập 12 tháng",
    price: 2990000,
    priceOnline: 2390000,
    note: "249K/tháng",
    isPopular: false,
    promotions: [
      "Tất cả quyền lợi gói 6 tháng",
      "Tiết kiệm 81K mỗi tháng so với gói 3 tháng",
      "+ 5 buổi tư vấn PT miễn phí",
      "Quà tặng dụng cụ tập trị giá 200K khi đăng ký"
    ]
  },
  {
    id: "mem-24m",
    durationMonths: 24,
    name: "Gói tập 24 tháng",
    price: 5500000,
    priceOnline: 4400000,
    note: "229K/tháng",
    promotions: [
      "Tất cả quyền lợi gói 12 tháng",
      "Tiết kiệm 101K mỗi tháng so với gói 3 tháng",
      "+8 buổi tư vấn PT miễn phí",
      "Giới thiệu 1 bạn đăng ký cùng gói chỉ 160K/tháng (tiết kiệm 30%)"
    ]
  },
  {
    id: "mem-60m",
    durationMonths: 60,
    name: "Gói tập 5 năm",
    price: 12000000,
    priceOnline: 9600000,
    note: "200K/tháng - Gói Platinum",
    promotions: [
      "Tất cả quyền lợi gói 24 tháng",
      "Tiết kiệm 130K mỗi tháng so với gói 3 tháng",
      "PT không giới hạn trong tháng đầu tiên",
      "Giới thiệu 1 bạn đăng ký cùng gói chỉ 140K/tháng (tiết kiệm 30%)",
      "Chuyển nhượng gói tập không mất phí (3 lần)"
    ]
  }
];

async function updateData() {
  const collectionRef = db.collection('memberships');

  for (const item of memberships) {
    const { id, ...data } = item;
    await collectionRef.doc(id).set(data);
    console.log(`✅ Đã cập nhật: ${id}`);
  }
  console.log('🚀 Tất cả dữ liệu đã được đồng bộ!');
  process.exit();
}

updateData();