// src/utils/vietqr.js
// Helper gọi VietQR API để tạo mã QR thanh toán
// Tách riêng để dễ thay thế nếu đổi nhà cung cấp QR sau này

/**
 * Tạo QR thanh toán từ VietQR
 * @param {object} params - Thông tin thanh toán
 * @param {string} params.accountNo - Số tài khoản
 * @param {string} params.accountName - Tên tài khoản
 * @param {string} params.bankId - Mã ngân hàng (ví dụ: MB, VCB)
 * @param {number} params.amount - Số tiền
 * @param {string} params.paymentCode - Mã đối chiếu
 * @returns {Promise<string>} URL ảnh QR hoặc chuỗi rỗng nếu lỗi
 */
const generateQR = ({ accountNo, accountName, bankId, amount, paymentCode }) => {
    try {
        const encodedInfo = encodeURIComponent(paymentCode);
        const encodedName = encodeURIComponent(accountName);

        return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.jpg`
            + `?amount=${amount}`
            + `&addInfo=${encodedInfo}`
            + `&accountName=${encodedName}`;
    } catch (err) {
        console.error('Lỗi tạo QR VietQR:', err);
        return '';
    }
};

module.exports = { generateQR };