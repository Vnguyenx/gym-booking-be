// seed.js
// Script chạy 1 lần để tạo toàn bộ dữ liệu equipment vào Firestore
// Chạy bằng lệnh: node seed.js

var admin = require('firebase-admin');
var serviceAccount = require('./serviceAccountKey.json');

// Khởi tạo Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ── Dữ liệu equipment ──────────────────────────────────────
const equipmentData = [

  // ── I. DỤNG CỤ — Thanh đòn ──
  { id: 'eq-don-01', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Cây đòn 2m2 (sắt sơn tĩnh điện)', nameVi: 'Cây đòn 2m2 sắt', category: 'accessory', subCategory: 'barbell', muscleGroups: ['toàn thân'], quantity: 2, imageUrls: [], description: 'Thanh đòn dài 2.2m, chất liệu sắt sơn tĩnh điện, dùng cho các bài tập barbell', tips: 'Kiểm tra đầu đòn trước khi tập' },
  { id: 'eq-don-02', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Cây đòn 2m2 (inox đặc)', nameVi: 'Cây đòn 2m2 inox', category: 'accessory', subCategory: 'barbell', muscleGroups: ['toàn thân'], quantity: 2, imageUrls: [], description: 'Thanh đòn dài 2.2m, chất liệu inox đặc, bền và chống gỉ', tips: 'Lau sạch sau khi dùng' },
  { id: 'eq-don-03', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Cây đòn 1m9', nameVi: 'Cây đòn 1m9', category: 'accessory', subCategory: 'barbell', muscleGroups: ['toàn thân'], quantity: 2, imageUrls: [], description: 'Thanh đòn dài 1.9m', tips: '' },
  { id: 'eq-don-04', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Cây đòn 1m6', nameVi: 'Cây đòn 1m6', category: 'accessory', subCategory: 'barbell', muscleGroups: ['toàn thân'], quantity: 2, imageUrls: [], description: 'Thanh đòn dài 1.6m', tips: '' },
  { id: 'eq-don-05', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Cây đòn 1m2', nameVi: 'Cây đòn 1m2', category: 'accessory', subCategory: 'barbell', muscleGroups: ['tay', 'ngực'], quantity: 2, imageUrls: [], description: 'Thanh đòn ngắn 1.2m, phù hợp bài tập tay và ngực hẹp', tips: '' },
  { id: 'eq-don-06', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Cây đòn ngắn tập tay', nameVi: 'Cây đòn ngắn tập tay', category: 'accessory', subCategory: 'barbell', muscleGroups: ['nhị đầu', 'tam đầu'], quantity: 2, imageUrls: [], description: 'Thanh đòn ngắn chuyên dùng cho bài tập tay', tips: '' },
  { id: 'eq-don-07', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Cây đòn Zig Zag (EZ Bar)', nameVi: 'Cây đòn EZ', category: 'accessory', subCategory: 'ez_bar', muscleGroups: ['nhị đầu', 'tam đầu'], quantity: 2, imageUrls: [], description: 'Thanh đòn hình zigzag giảm áp lực cổ tay khi tập tay', tips: 'Phù hợp cho người đau cổ tay' },
  { id: 'eq-don-08', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Cây đòn H nhỏ', nameVi: 'Cây đòn H nhỏ', category: 'accessory', subCategory: 'trap_bar', muscleGroups: ['lưng', 'chân', 'mông'], quantity: 2, imageUrls: [], description: 'Thanh đòn hình chữ H cỡ nhỏ, dùng cho deadlift và shrug', tips: '' },
  { id: 'eq-don-09', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Cây đòn H to', nameVi: 'Cây đòn H to', category: 'accessory', subCategory: 'trap_bar', muscleGroups: ['lưng', 'chân', 'mông'], quantity: 2, imageUrls: [], description: 'Thanh đòn hình chữ H cỡ lớn, dùng cho deadlift nặng', tips: '' },

  // ── I. DỤNG CỤ — Phụ kiện ──
  { id: 'eq-acc-01', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Dây kháng lực', nameVi: 'Dây kháng lực', category: 'accessory', subCategory: 'resistance_band', muscleGroups: ['toàn thân'], quantity: 1, imageUrls: [], description: 'Bộ dây kháng lực nhiều mức độ', tips: 'Kiểm tra dây trước khi dùng' },
  { id: 'eq-acc-02', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cardio', name: 'Dây nhảy', nameVi: 'Dây nhảy', category: 'accessory', subCategory: 'jump_rope', muscleGroups: ['tim mạch', 'bắp chân'], quantity: 1, imageUrls: [], description: 'Dây nhảy cardio', tips: '' },
  { id: 'eq-acc-03', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Đồ cố định bánh tạ (Collar)', nameVi: 'Collar kẹp tạ', category: 'accessory', subCategory: 'collar', muscleGroups: [], quantity: 20, imageUrls: [], description: 'Kẹp cố định bánh tạ vào thanh đòn, tránh tạ tuột ra ngoài', tips: 'Luôn dùng collar khi tập nặng' },
  { id: 'eq-acc-04', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Đai lưng', nameVi: 'Đai lưng', category: 'accessory', subCategory: 'belt', muscleGroups: ['lưng'], quantity: 4, imageUrls: [], description: 'Đai hỗ trợ lưng khi tập nặng', tips: 'Chỉ dùng khi tập squat hoặc deadlift nặng' },
  { id: 'eq-acc-05', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Squat Pad / Barbell Pad', nameVi: 'Đệm tạ đòn', category: 'accessory', subCategory: 'squat_pad', muscleGroups: [], quantity: 4, imageUrls: [], description: 'Đệm mút bọc thanh barbell, giảm áp lực lên cổ và vai khi squat hoặc hip thrust', tips: '' },

  // ── I. DỤNG CỤ — Ghế ──
  { id: 'eq-chair-01', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Ghế ngồi', nameVi: 'Ghế ngồi', category: 'accessory', subCategory: 'chair', muscleGroups: [], quantity: 10, imageUrls: [], description: 'Ghế ngồi thông thường dùng trong phòng gym', tips: '' },
  { id: 'eq-chair-02', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Adjustable Bench', nameVi: 'Ghế tập điều chỉnh góc', category: 'accessory', subCategory: 'adjustable_bench', muscleGroups: ['ngực', 'vai', 'tay'], quantity: 6, imageUrls: [], description: 'Ghế tập có thể điều chỉnh nhiều góc: nằm phẳng, nghiêng lên, nghiêng xuống', tips: 'Kiểm tra chốt khóa góc trước khi nằm' },
  { id: 'eq-chair-03', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Flat Bench Press Station', nameVi: 'Bàn đẩy ngực nằm', category: 'free_weight', subCategory: 'bench_press_flat', muscleGroups: ['ngực giữa', 'tam đầu', 'vai trước'], quantity: 3, imageUrls: [], description: 'Ghế phẳng + rack barbell chuyên dùng cho bài Flat Bench Press', tips: 'Luôn có người canh tạ khi tập nặng' },
  { id: 'eq-chair-04', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Incline Bench Press Station', nameVi: 'Bàn đẩy ngực nghiêng lên', category: 'free_weight', subCategory: 'bench_press_incline', muscleGroups: ['ngực trên', 'vai trước', 'tam đầu'], quantity: 2, imageUrls: [], description: 'Ghế nghiêng + rack barbell chuyên dùng cho bài Incline Bench Press', tips: '' },
  { id: 'eq-chair-05', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Decline Bench Press Station', nameVi: 'Bàn đẩy ngực nghiêng xuống', category: 'free_weight', subCategory: 'bench_press_decline', muscleGroups: ['ngực dưới', 'tam đầu'], quantity: 2, imageUrls: [], description: 'Ghế nghiêng xuống + rack barbell cho bài Decline Bench Press', tips: '' },

  // ── I. DỤNG CỤ — Bánh tạ ──
  { id: 'eq-plate-01', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Bánh tạ 2.5kg', nameVi: 'Bánh tạ 2.5kg', category: 'accessory', subCategory: 'weight_plate', muscleGroups: [], quantity: 10, imageUrls: [], description: 'Bánh tạ đĩa 2.5kg', tips: '' },
  { id: 'eq-plate-02', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Bánh tạ 5kg', nameVi: 'Bánh tạ 5kg', category: 'accessory', subCategory: 'weight_plate', muscleGroups: [], quantity: 30, imageUrls: [], description: 'Bánh tạ đĩa 5kg', tips: '' },
  { id: 'eq-plate-03', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Bánh tạ 10kg', nameVi: 'Bánh tạ 10kg', category: 'accessory', subCategory: 'weight_plate', muscleGroups: [], quantity: 30, imageUrls: [], description: 'Bánh tạ đĩa 10kg', tips: '' },
  { id: 'eq-plate-04', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Bánh tạ 20kg', nameVi: 'Bánh tạ 20kg', category: 'accessory', subCategory: 'weight_plate', muscleGroups: [], quantity: 20, imageUrls: [], description: 'Bánh tạ đĩa 20kg', tips: '' },
  { id: 'eq-plate-05', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Bánh tạ 25kg', nameVi: 'Bánh tạ 25kg', category: 'accessory', subCategory: 'weight_plate', muscleGroups: [], quantity: 20, imageUrls: [], description: 'Bánh tạ đĩa 25kg', tips: '' },

  // ── I. DỤNG CỤ — Tạ ấm ──
  { id: 'eq-kb-01', gymId: 'main-gym', floorId: 'floor-1', zoneId: 'zone-dumbbell', name: 'Tạ ấm 1kg - 20kg', nameVi: 'Tạ ấm (Kettlebell)', category: 'free_weight', subCategory: 'kettlebell', muscleGroups: ['toàn thân'], quantity: 40, imageUrls: [], description: 'Tạ ấm từ 1kg đến 20kg, mỗi kg có 2 cái', tips: 'Dùng đúng kỹ thuật khi swing' },

  // ── I. DỤNG CỤ — Tay cầm cable ──
  { id: 'eq-cable-att-01', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'Multi-Grip Lat Bar (Wide)', nameVi: 'Thanh kéo lat tay cầm rộng', category: 'accessory', subCategory: 'cable_attachment', muscleGroups: ['lưng', 'nhị đầu'], quantity: 4, imageUrls: [], description: 'Thanh dài có 2 tay cầm D-Handle rộng ở 2 đầu', tips: '' },
  { id: 'eq-cable-att-02', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'Multi-Grip Lat Bar (Narrow)', nameVi: 'Thanh kéo lat tay cầm hẹp', category: 'accessory', subCategory: 'cable_attachment', muscleGroups: ['lưng', 'nhị đầu'], quantity: 4, imageUrls: [], description: 'Thanh có 2 tay cầm D-Handle gần nhau hơn', tips: '' },
  { id: 'eq-cable-att-03', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'Straight Lat Bar', nameVi: 'Thanh kéo lat thẳng', category: 'accessory', subCategory: 'cable_attachment', muscleGroups: ['lưng lat'], quantity: 4, imageUrls: [], description: 'Thanh thẳng dài dùng cho lat pulldown tay rộng', tips: '' },
  { id: 'eq-cable-att-04', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'EZ Curl Cable Bar', nameVi: 'Thanh EZ cable', category: 'accessory', subCategory: 'cable_attachment', muscleGroups: ['nhị đầu', 'tam đầu'], quantity: 4, imageUrls: [], description: 'Thanh zigzag gắn cable, giảm áp lực cổ tay', tips: '' },
  { id: 'eq-cable-att-05', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'Tricep Rope', nameVi: 'Dây thừng tam đầu', category: 'accessory', subCategory: 'cable_attachment', muscleGroups: ['tam đầu'], quantity: 4, imageUrls: [], description: 'Dây thừng 2 đầu bọc cao su dùng cho tricep pushdown và face pull', tips: '' },
  { id: 'eq-cable-att-06', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'D-Handle (Single)', nameVi: 'Tay cầm chữ D đơn', category: 'accessory', subCategory: 'cable_attachment', muscleGroups: ['toàn thân'], quantity: 4, imageUrls: [], description: 'Tay cầm chữ D cho từng tay riêng lẻ, dùng cho nhiều bài nhất', tips: '' },
  { id: 'eq-cable-att-07', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'Short Straight Bar', nameVi: 'Thanh ngắn thẳng', category: 'accessory', subCategory: 'cable_attachment', muscleGroups: ['tam đầu', 'nhị đầu'], quantity: 4, imageUrls: [], description: 'Thanh ngắn thẳng dùng cho tricep pushdown và bicep curl', tips: '' },
  { id: 'eq-cable-att-08', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'V-Bar Narrow (Wide Grip)', nameVi: 'V-Bar hẹp tay rộng', category: 'accessory', subCategory: 'cable_attachment', muscleGroups: ['lưng', 'nhị đầu'], quantity: 4, imageUrls: [], description: 'Thanh chữ V ngắn có miếng đệm vai lớn', tips: '' },
  { id: 'eq-cable-att-09', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'V-Bar Narrow (Medium Grip)', nameVi: 'V-Bar hẹp tay vừa', category: 'accessory', subCategory: 'cable_attachment', muscleGroups: ['lưng'], quantity: 4, imageUrls: [], description: 'Thanh chữ V ngắn miếng đệm nhỏ hơn', tips: '' },
  { id: 'eq-cable-att-10', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'V-Bar Medium', nameVi: 'V-Bar vừa', category: 'accessory', subCategory: 'cable_attachment', muscleGroups: ['lưng'], quantity: 4, imageUrls: [], description: 'Thanh chữ V dài vừa không có miếng đệm', tips: '' },
  { id: 'eq-cable-att-11', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'V-Bar Wide', nameVi: 'V-Bar rộng', category: 'accessory', subCategory: 'cable_attachment', muscleGroups: ['lưng'], quantity: 4, imageUrls: [], description: 'Thanh chữ V dài hơn tay cầm xa nhau', tips: '' },
  { id: 'eq-cable-att-12', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'V-Bar Extra Wide', nameVi: 'V-Bar rất rộng', category: 'accessory', subCategory: 'cable_attachment', muscleGroups: ['lưng lat'], quantity: 4, imageUrls: [], description: 'Thanh chữ V dài nhất tay cầm rộng nhất', tips: '' },
  { id: 'eq-cable-att-13', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'Triangle Handle', nameVi: 'Tay cầm tam giác', category: 'accessory', subCategory: 'cable_attachment', muscleGroups: ['lưng', 'nhị đầu'], quantity: 4, imageUrls: [], description: 'Tay cầm hình tam giác tay để dọc', tips: '' },
  { id: 'eq-cable-att-14', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'Close Grip Row Handle', nameVi: 'Tay cầm row hẹp', category: 'accessory', subCategory: 'cable_attachment', muscleGroups: ['lưng giữa'], quantity: 4, imageUrls: [], description: 'Tay cầm hình chữ nhật 2 tay song song sát nhau', tips: '' },
  { id: 'eq-cable-att-15', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'Ankle Strap', nameVi: 'Đai cổ chân', category: 'accessory', subCategory: 'cable_attachment', muscleGroups: ['mông', 'đùi sau', 'đùi trong'], quantity: 4, imageUrls: [], description: 'Đai đeo vào cổ chân dùng cho các bài tập chân với cable', tips: '' },

  // ── II. CÁP ──
  { id: 'eq-cable-01', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'Multi-Station Cable Machine', nameVi: 'Dàn cable đa trạm', category: 'cable', subCategory: 'multi_station', muscleGroups: ['toàn thân'], quantity: 1, imageUrls: [], description: 'Dàn cable lớn nhiều trạm tập, nhiều người dùng cùng lúc', tips: 'Điều chỉnh đúng chiều cao pulley trước khi tập' },
  { id: 'eq-cable-02', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-cable', name: 'Functional Trainer (Cable Cross)', nameVi: 'Máy cable chéo', category: 'cable', subCategory: 'functional_trainer', muscleGroups: ['toàn thân'], quantity: 2, imageUrls: [], description: '2 cột cable điều chỉnh độ cao tự do, tập được rất nhiều bài', tips: 'Điều chỉnh độ cao 2 bên bằng nhau khi tập chest fly' },

  // ── III. MÁY — Thân trên — Tay ──
  { id: 'eq-machine-01', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Seated Bicep Curl Machine', nameVi: 'Máy curl nhị đầu ngồi', category: 'machine', subCategory: 'bicep_curl', muscleGroups: ['nhị đầu'], quantity: 1, imageUrls: [], description: 'Máy tập cơ nhị đầu tư thế ngồi, cô lập cơ tốt', tips: 'Không dùng momentum, co cơ chậm rãi' },
  { id: 'eq-machine-02', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Seated Dip Machine', nameVi: 'Máy dip tam đầu ngồi', category: 'machine', subCategory: 'tricep_dip', muscleGroups: ['tam đầu'], quantity: 1, imageUrls: [], description: 'Máy tập cơ tam đầu tư thế ngồi', tips: '' },
  { id: 'eq-machine-03', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Assisted Pull-Up / Chin-Dip Combo Machine', nameVi: 'Máy hỗ trợ xà + dip', category: 'machine', subCategory: 'assisted_pullup', muscleGroups: ['lưng lat', 'nhị đầu', 'tam đầu'], quantity: 1, imageUrls: [], description: 'Máy hỗ trợ tập pull-up và dip với counterweight giảm trọng lượng cơ thể', tips: 'Càng ít counterweight càng khó' },

  // ── III. MÁY — Thân trên — Ngực ──
  { id: 'eq-machine-04', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Incline Chest Press Machine', nameVi: 'Máy đẩy ngực trên', category: 'machine', subCategory: 'chest_press_incline', muscleGroups: ['ngực trên', 'vai trước', 'tam đầu'], quantity: 2, imageUrls: [], description: 'Máy đẩy ngực góc nghiêng lên, tập trung cơ ngực trên', tips: 'Ngồi thẳng lưng, không nhấc mông khỏi ghế' },
  { id: 'eq-machine-05', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Chest Press Machine (Flat)', nameVi: 'Máy đẩy ngực phẳng', category: 'machine', subCategory: 'chest_press_flat', muscleGroups: ['ngực giữa', 'tam đầu', 'vai trước'], quantity: 2, imageUrls: [], description: 'Máy đẩy ngực phẳng, tập cơ ngực giữa', tips: '' },
  { id: 'eq-machine-06', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Pec Deck Machine', nameVi: 'Máy bay ngực', category: 'machine', subCategory: 'pec_deck', muscleGroups: ['ngực lớn', 'ngực nhỏ'], quantity: 1, imageUrls: [], description: 'Máy ép ngực 2 cánh tay vào nhau, cô lập cơ ngực tốt', tips: 'Giữ lưng sát ghế, không ngả người ra trước' },
  { id: 'eq-machine-07', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Reverse Pec Deck Machine', nameVi: 'Máy bay vai sau', category: 'machine', subCategory: 'rear_delt_fly', muscleGroups: ['vai sau', 'lưng trên'], quantity: 1, imageUrls: [], description: 'Ngồi ngược lại so với Pec Deck, kéo 2 tay ra sau tập cơ vai sau', tips: 'Cùng máy với Pec Deck, chỉ cần đổi hướng ngồi' },
  { id: 'eq-machine-08', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Decline Chest Press Machine', nameVi: 'Máy đẩy ngực dưới', category: 'machine', subCategory: 'chest_press_decline', muscleGroups: ['ngực dưới', 'tam đầu'], quantity: 2, imageUrls: [], description: 'Máy đẩy ngực góc nghiêng xuống, tập cơ ngực dưới', tips: '' },

  // ── III. MÁY — Thân trên — Lưng ──
  { id: 'eq-machine-09', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Seated Cable Row Machine', nameVi: 'Máy kéo lưng ngồi', category: 'machine', subCategory: 'seated_cable_row', muscleGroups: ['lưng trên', 'lưng giữa', 'nhị đầu'], quantity: 1, imageUrls: [], description: 'Máy kéo cable ngồi, điều chỉnh được độ cao pulley', tips: 'Kéo về phía bụng, không ngả lưng quá nhiều' },
  { id: 'eq-machine-10', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Lat Pulldown Machine', nameVi: 'Máy kéo xô lat', category: 'machine', subCategory: 'lat_pulldown', muscleGroups: ['lưng lat', 'nhị đầu', 'vai sau'], quantity: 1, imageUrls: [], description: 'Máy kéo thanh từ trên xuống, tập cơ lưng rộng', tips: 'Kéo về phía ngực, không kéo sau gáy' },
  { id: 'eq-machine-11', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'T-Bar Row Machine', nameVi: 'Máy kéo T-Bar', category: 'machine', subCategory: 't_bar_row', muscleGroups: ['lưng giữa', 'lưng trên', 'nhị đầu'], quantity: 1, imageUrls: [], description: 'Máy kéo lưng dạng T-Bar, tập cơ lưng dày', tips: 'Giữ lưng thẳng, không cong lưng' },
  { id: 'eq-machine-12', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Hyperextension Machine', nameVi: 'Máy duỗi lưng', category: 'machine', subCategory: 'hyperextension', muscleGroups: ['lưng dưới', 'mông', 'đùi sau'], quantity: 1, imageUrls: [], description: 'Máy tập cơ lưng dưới và mông tư thế cúi người', tips: 'Không ưỡn lưng quá mức' },

  // ── III. MÁY — Thân trên — Bụng ──
  { id: 'eq-machine-13', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Ab Crunch Machine', nameVi: 'Máy tập bụng trên', category: 'machine', subCategory: 'ab_crunch', muscleGroups: ['bụng trên'], quantity: 1, imageUrls: [], description: 'Máy tập cơ bụng trên tư thế ngồi', tips: 'Thở ra khi co bụng' },
  { id: 'eq-machine-14', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Roman Chair / Captain\'s Chair', nameVi: 'Ghế Roman / Captain Chair', category: 'machine', subCategory: 'roman_chair', muscleGroups: ['bụng dưới', 'hông'], quantity: 1, imageUrls: [], description: 'Ghế có tay tựa để tập bụng dưới và nâng chân', tips: '' },
  { id: 'eq-machine-15', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Rotary Torso Machine', nameVi: 'Máy xoay eo', category: 'machine', subCategory: 'rotary_torso', muscleGroups: ['cơ liên sườn', 'bụng bên'], quantity: 1, imageUrls: [], description: 'Máy xoay thân người tập cơ liên sườn và bụng bên', tips: 'Xoay chậm rãi, không giật mạnh' },

  // ── III. MÁY — Thân trên — Vai ──
  { id: 'eq-machine-16', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Shoulder Press Machine (Smith)', nameVi: 'Máy đẩy vai Smith', category: 'machine', subCategory: 'shoulder_press_smith', muscleGroups: ['vai trước', 'vai giữa', 'tam đầu'], quantity: 2, imageUrls: [], description: 'Máy đẩy vai dùng Smith Machine, quỹ đạo cố định an toàn hơn', tips: 'Điều chỉnh ghế đúng chiều cao trước khi tập' },
  { id: 'eq-machine-17', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-upper-machine', name: 'Lateral Raise Machine', nameVi: 'Máy nâng vai giữa', category: 'machine', subCategory: 'lateral_raise', muscleGroups: ['vai giữa'], quantity: 2, imageUrls: [], description: 'Máy nâng tay ngang cô lập cơ vai giữa', tips: 'Không nhún vai khi tập' },

  // ── III. MÁY — Thân dưới — Đùi ──
  { id: 'eq-machine-18', gymId: 'main-gym', floorId: 'floor-1', zoneId: 'zone-lower-machine', name: 'Leg Extension Machine', nameVi: 'Máy duỗi đùi trước', category: 'machine', subCategory: 'leg_extension', muscleGroups: ['đùi trước', 'tứ đầu đùi'], quantity: 1, imageUrls: [], description: 'Máy duỗi chân cô lập cơ tứ đầu đùi', tips: 'Không khóa gối hoàn toàn ở đỉnh chuyển động' },
  { id: 'eq-machine-19', gymId: 'main-gym', floorId: 'floor-1', zoneId: 'zone-lower-machine', name: 'Hack Squat Machine', nameVi: 'Máy Hack Squat', category: 'machine', subCategory: 'hack_squat', muscleGroups: ['đùi trước', 'đùi giữa', 'mông'], quantity: 1, imageUrls: [], description: 'Máy squat góc nghiêng, giảm áp lực lưng so với squat tự do', tips: 'Đặt chân đúng vị trí trên tấm đứng' },
  { id: 'eq-machine-20', gymId: 'main-gym', floorId: 'floor-1', zoneId: 'zone-lower-machine', name: 'Leg Press Machine', nameVi: 'Máy đẩy chân', category: 'machine', subCategory: 'leg_press', muscleGroups: ['đùi trước', 'đùi giữa', 'mông', 'đùi sau'], quantity: 1, imageUrls: [], description: 'Máy đẩy chân góc nghiêng, tập được nhiều nhóm cơ chân', tips: 'Không khóa gối ở đỉnh, giữ lưng sát ghế' },
  { id: 'eq-machine-21', gymId: 'main-gym', floorId: 'floor-1', zoneId: 'zone-lower-machine', name: 'Hip Abduction Machine', nameVi: 'Máy dạng đùi ngoài', category: 'machine', subCategory: 'hip_abduction', muscleGroups: ['đùi ngoài', 'mông nhỏ', 'mông vừa'], quantity: 1, imageUrls: [], description: 'Máy đẩy 2 chân ra ngoài tập cơ đùi ngoài và mông nhỏ', tips: '' },
  { id: 'eq-machine-22', gymId: 'main-gym', floorId: 'floor-1', zoneId: 'zone-lower-machine', name: 'Hip Adduction Machine', nameVi: 'Máy khép đùi trong', category: 'machine', subCategory: 'hip_adduction', muscleGroups: ['đùi trong'], quantity: 1, imageUrls: [], description: 'Máy ép 2 chân vào trong tập cơ đùi trong', tips: '' },
  { id: 'eq-machine-23', gymId: 'main-gym', floorId: 'floor-1', zoneId: 'zone-lower-machine', name: 'Lying Leg Curl Machine', nameVi: 'Máy curl đùi sau nằm', category: 'machine', subCategory: 'lying_leg_curl', muscleGroups: ['đùi sau', 'cơ nhị đầu đùi'], quantity: 2, imageUrls: [], description: 'Máy cuộn chân tư thế nằm sấp, tập cơ đùi sau', tips: 'Không nhấc hông khỏi bệ' },
  { id: 'eq-machine-24', gymId: 'main-gym', floorId: 'floor-1', zoneId: 'zone-lower-machine', name: '2-in-1 Leg Extension & Curl Combo', nameVi: 'Máy đùi kết hợp 2in1', category: 'machine', subCategory: 'leg_extension_curl_combo', muscleGroups: ['đùi trước', 'đùi sau'], quantity: 1, imageUrls: [], description: 'Máy kết hợp Leg Extension và Leg Curl trên cùng 1 thiết bị', tips: '' },

  // ── III. MÁY — Thân dưới — Mông ──
  { id: 'eq-machine-25', gymId: 'main-gym', floorId: 'floor-1', zoneId: 'zone-lower-machine', name: 'Hip Thrust Machine', nameVi: 'Máy hip thrust', category: 'machine', subCategory: 'hip_thrust', muscleGroups: ['mông lớn', 'đùi sau', 'lưng dưới'], quantity: 2, imageUrls: [], description: 'Máy đẩy hông chuyên tập cơ mông lớn', tips: 'Đẩy hông lên cao hết tầm, siết mông ở đỉnh' },
  { id: 'eq-machine-26', gymId: 'main-gym', floorId: 'floor-1', zoneId: 'zone-lower-machine', name: 'Glute Kickback Machine', nameVi: 'Máy kickback mông', category: 'machine', subCategory: 'glute_kickback', muscleGroups: ['mông lớn', 'mông nhỏ', 'đùi sau'], quantity: 2, imageUrls: [], description: 'Máy đá chân ra sau tập cơ mông', tips: 'Siết mông ở đỉnh chuyển động' },

  // ── III. MÁY — Thân dưới — Bắp chân ──
  { id: 'eq-machine-27', gymId: 'main-gym', floorId: 'floor-1', zoneId: 'zone-lower-machine', name: 'Standing Calf Raise Machine', nameVi: 'Máy kiễng gót đứng', category: 'machine', subCategory: 'calf_raise_standing', muscleGroups: ['bắp chân ngoài', 'cơ bụng chân'], quantity: 3, imageUrls: [], description: 'Máy kiễng gót tư thế đứng tập cơ bắp chân ngoài', tips: 'Hạ gót xuống thấp hết tầm để tăng biên độ' },

  // ── IV. TẠ ĐƠN ──
  { id: 'eq-db-01', gymId: 'main-gym', floorId: 'floor-1', zoneId: 'zone-dumbbell', name: 'Dàn tạ đơn 2.5kg - 45kg', nameVi: 'Dàn tạ đơn', category: 'free_weight', subCategory: 'dumbbell_rack', muscleGroups: ['toàn thân'], quantity: 3, imageUrls: [], description: '3 dàn tạ đơn từ 2.5kg đến 45kg, mỗi dàn đầy đủ các mức', tips: 'Để tạ về đúng vị trí sau khi dùng' },

  // ── V. KHU VỰC TỰ DO ──
  { id: 'eq-free-01', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Smith Machine', nameVi: 'Máy Smith', category: 'free_weight', subCategory: 'smith_machine', muscleGroups: ['toàn thân'], quantity: 4, imageUrls: [], description: 'Máy Smith thanh barbell chạy theo rãnh cố định, an toàn hơn tập tự do', tips: 'Luôn cài chốt an toàn trước khi tập' },
  { id: 'eq-free-02', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Power Rack / Squat Rack', nameVi: 'Khung squat', category: 'free_weight', subCategory: 'power_rack', muscleGroups: ['toàn thân'], quantity: 4, imageUrls: [], description: 'Khung tập squat và bench press tự do, có thanh đỡ an toàn', tips: 'Điều chỉnh thanh đỡ đúng độ cao trước khi tập' },
  { id: 'eq-free-03', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Sàn Deadlift', nameVi: 'Sàn Deadlift', category: 'free_weight', subCategory: 'deadlift_platform', muscleGroups: ['lưng', 'chân', 'mông'], quantity: 2, imageUrls: [], description: 'Sàn có thảm cao su chống chấn chuyên dùng cho deadlift', tips: 'Không thả tạ mạnh xuống sàn' },
  { id: 'eq-free-04', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Xà đơn', nameVi: 'Xà đơn', category: 'free_weight', subCategory: 'pull_up_bar', muscleGroups: ['lưng lat', 'nhị đầu', 'core'], quantity: 2, imageUrls: [], description: 'Thanh xà đơn treo người tập pull-up và chin-up', tips: 'Kiểm tra độ chắc chắn trước khi tập' },
  { id: 'eq-free-05', gymId: 'main-gym', floorId: 'floor-0', zoneId: 'zone-free-weight', name: 'Xà kép', nameVi: 'Xà kép', category: 'free_weight', subCategory: 'dip_bar', muscleGroups: ['tam đầu', 'ngực dưới', 'vai trước'], quantity: 2, imageUrls: [], description: 'Thanh xà kép 2 tay tập dip và tricep', tips: '' },

  // ── V. CARDIO ──
  { id: 'eq-cardio-01', gymId: 'main-gym', floorId: 'floor-1', zoneId: 'zone-cardio', name: 'Máy đi bộ (Treadmill)', nameVi: 'Máy chạy bộ', category: 'cardio', subCategory: 'treadmill', muscleGroups: ['tim mạch', 'chân', 'bắp chân'], quantity: 6, imageUrls: [], description: 'Máy chạy bộ điện, điều chỉnh tốc độ và độ dốc', tips: 'Khởi động 5 phút tốc độ chậm trước khi chạy nhanh' },
  { id: 'eq-cardio-02', gymId: 'main-gym', floorId: 'floor-1', zoneId: 'zone-cardio', name: 'Máy leo cầu thang (Stair Climber)', nameVi: 'Máy leo cầu thang', category: 'cardio', subCategory: 'stair_climber', muscleGroups: ['tim mạch', 'mông', 'đùi', 'bắp chân'], quantity: 4, imageUrls: [], description: 'Máy leo cầu thang mô phỏng leo bậc thang thật, đốt calo cao', tips: 'Không dựa tay quá nhiều vào tay vịn' },
];

// ── Hàm seed data ──────────────────────────────────────────
const seedEquipment = async () => {
  console.log('Bắt đầu seed equipment...');

  const batch = db.batch(); // batch write — ghi nhiều document cùng lúc

  equipmentData.forEach((item) => {
    const docRef = db.collection('equipment').doc(item.id);
    batch.set(docRef, {
      ...item,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  console.log(`Đã tạo thành công ${equipmentData.length} documents trong collection equipment!`);
  process.exit(0);
};

// Chạy seed
seedEquipment().catch((err) => {
  console.error('Lỗi khi seed:', err);
  process.exit(1);
});