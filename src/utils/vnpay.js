// src/utils/vnpay.js
const crypto = require('crypto');
const qs = require('qs');

/**
 * Hàm sắp xếp các thuộc tính của object theo thứ tự alphabet (VNPay yêu cầu)
 */
function sortObject(obj) {
    let sorted = {};
    let str = [];
    // Dùng Object.keys() thay vì for...in + hasOwnProperty
    Object.keys(obj).forEach(key => {
        str.push(encodeURIComponent(key));
    });
    str.sort();
    for (let key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[decodeURIComponent(str[key])]).replace(/%20/g, "+");
    }
    return sorted;
}

/**
 * Hàm tạo URL thanh toán
 */
const generateVnpayUrl = (req, amount, bookingId) => {
    const date = new Date();

    // Định dạng ngày: YYYYMMDDHHmmss
    const createDate = date.getFullYear() +
        ("0" + (date.getMonth() + 1)).slice(-2) +
        ("0" + date.getDate()).slice(-2) +
        ("0" + date.getHours()).slice(-2) +
        ("0" + date.getMinutes()).slice(-2) +
        ("0" + date.getSeconds()).slice(-2);

    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURNURL || "https://vnguyenx.github.io/booking_success";

    // Lấy IP của người dùng (VNPay dùng để phòng chống gian lận)
    const ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    let vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': tmnCode,
        'vnp_Locale': 'vn',
        'vnp_CurrCode': 'VND',
        'vnp_TxnRef': bookingId, // ID đơn hàng của bạn
        'vnp_OrderInfo': `Thanh toan booking ${bookingId}`,
        'vnp_OrderType': 'other',
        'vnp_Amount': amount * 100, // Đơn vị là xu (VNPay quy định lấy VND * 100)
        'vnp_ReturnUrl': returnUrl,
        'vnp_IpAddr': ipAddr,
        'vnp_CreateDate': createDate,
    };

    // 1. Sắp xếp params
    vnp_Params = sortObject(vnp_Params);

    // 2. Tạo chuỗi ký tự để băm
    const signData = qs.stringify(vnp_Params, { encode: false });

    // 3. Tạo mã HMAC-SHA512
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    // 4. Thêm mã băm vào cuối URL
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

    return vnpUrl;
};

module.exports = { generateVnpayUrl, sortObject };