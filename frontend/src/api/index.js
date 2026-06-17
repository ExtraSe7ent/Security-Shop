import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
window.BACKEND_URL = API_BASE_URL; // Phơi bày toàn cục để dễ demo trên Console F12 ở cloud công cộng

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Gắn JWT token vào mọi request nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Xử lý phản hồi 401 (token hết hạn/không hợp lệ)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Không chuyển hướng ở đây — để component xử lý
    }
    return Promise.reject(error);
  }
);

// ─── Xác thực ───────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),

  register: (data) =>
    api.post('/api/auth/register', data),

  getMe: () =>
    api.get('/api/auth/me'),
};

// ─── Sản phẩm ───────────────────────────────────────────────────
export const productsAPI = {
  getAll: () =>
    api.get('/api/products'),

  // Trả về { product, reviews } trong một phản hồi
  getById: (id) =>
    api.get(`/api/products/${id}`),

  search: (query) =>
    api.get(`/api/products/search?q=${encodeURIComponent(query)}`),
};

// ─── Ký request bằng HMAC (CHẾ ĐỘ SECURE — Lớp 4) ───────────────────────
// Phản chiếu logic phía server trong security.py: generate_order_hmac()
// Sử dụng Web Crypto API (API tích hợp của trình duyệt, không cần thư viện ngoài)
const HMAC_SHARED_SECRET = "securityshop-hmac-secret-2024";

async function signOrderBody(orderBody) {
  const timestamp = new Date().toISOString();
  // Dạng canonical: JSON compact (không space) với key đã sắp xếp + "|" + timestamp
  // PHẢI khớp với backend Python: json.dumps(sort_keys=True, separators=(",", ":"))
  const sortedObj = Object.keys(orderBody).sort().reduce((acc, k) => { acc[k] = orderBody[k]; return acc; }, {});
  // JSON.stringify mặc định không có space → khớp với separators=(",",":")
  const canonical = JSON.stringify(sortedObj) + "|" + timestamp;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(HMAC_SHARED_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(canonical));
  const sigHex = Array.from(new Uint8Array(sigBuffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return { signature: sigHex, timestamp };
}

// ─── Đơn hàng ─────────────────────────────────────────────────────
export const ordersAPI = {
  getAll: () =>
    api.get('/api/orders'),

  getById: (id) =>
    api.get(`/api/orders/${id}`),

  create: async (data) => {
    // Phát hiện chế độ hiện tại để quyết định có ký request hay không
    let mode = "base";
    try {
      const modeRes = await api.get('/api/mode');
      mode = modeRes.data.mode;
    } catch (_) { /* bỏ qua — dùng base làm dự phòng */ }

    if (mode === "secure") {
      // SECURE: Ký nội dung request trước khi gửi
      const { signature, timestamp } = await signOrderBody(data);
      return api.post('/api/orders', data, {
        headers: {
          "X-Signature": signature,
          "X-Timestamp": timestamp,
        },
      });
    }
    // BASE (LỖ HỔNG): Không có chữ ký — server tin tưởng bất cứ thứ gì chúng ta gửi
    return api.post('/api/orders', data);
  },
};


// ─── Thanh toán ───────────────────────────────────────────────────
export const paymentsAPI = {
  getCards: () =>
    api.get('/api/payments'),

  addCard: (data) =>
    api.post('/api/payments', data),
};

// ─── Đánh giá ────────────────────────────────────────────────────
export const reviewsAPI = {
  create: (data) =>
    api.post('/api/reviews', data),
};

// ─── Chatbot ────────────────────────────────────────────────────
export const chatAPI = {
  send: (message, productId = null) =>
    api.post('/api/chat', { message, product_id: productId }),
};

// ─── Chế độ ───────────────────────────────────────────────────────
export const modeAPI = {
  getMode: () =>
    api.get('/api/mode'),

  setMode: (mode) =>
    api.post('/api/mode', { mode }),
};

// ─── Shipper (Demo phòng thủ MitM) ────────────────────────────────
export const shipperAPI = {
  getOrder: (id) =>
    api.get(`/api/orders/shipper/${id}`),

  updateStatus: (id, status) =>
    api.put(`/api/orders/shipper/${id}/status`, { status }),
};

export default api;

