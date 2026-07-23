/**
 * Cấu hình API tập trung cho toàn bộ Frontend
 * ============================================
 * Khi cần thay đổi địa chỉ backend, chỉ cần sửa file .env:
 *   REACT_APP_API_URL=https://your-api-url.com/api
 *   REACT_APP_BASE_URL=https://your-api-url.com
 * 
 * Hoặc sửa giá trị DEFAULT bên dưới nếu không dùng .env.
 */

// === URL MẶC ĐỊNH (dùng khi .env không có giá trị) ===
const DEFAULT_BASE_URL = 'https://pet-care-service-u88y.onrender.com';
const DEFAULT_API_URL = 'https://pet-care-service-u88y.onrender.com/api';

// === EXPORT CÁC GIÁ TRỊ CHÍNH ===

/** Base URL của backend (KHÔNG có /api) - dùng cho ảnh, SignalR, v.v. */
export const BASE_URL = process.env.REACT_APP_BASE_URL || DEFAULT_BASE_URL;

/** API URL của backend (CÓ /api) - dùng cho các API call */
export const API_URL = process.env.REACT_APP_API_URL || DEFAULT_API_URL;

/** SignalR Hub URL */
export const SIGNALR_HUB_URL = `${BASE_URL}/timeSlotHub`;

// === HELPER FUNCTIONS ===

/**
 * Tạo URL đầy đủ cho ảnh từ đường dẫn tương đối
 * @param {string} path - Đường dẫn ảnh (vd: /uploads/pets/abc.jpg)
 * @returns {string} URL đầy đủ
 */
export const getFullImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
};

/**
 * Tạo URL đầy đủ cho API endpoint (dùng với fetch)
 * @param {string} endpoint - Endpoint (vd: /Products/123)
 * @returns {string} URL đầy đủ
 */
export const getApiUrl = (endpoint) => {
  return `${API_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
};

export default {
  BASE_URL,
  API_URL,
  SIGNALR_HUB_URL,
  getFullImageUrl,
  getApiUrl,
};
