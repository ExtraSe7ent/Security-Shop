import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
window.BACKEND_URL = API_BASE_URL; const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),

  register: (data) =>
    api.post('/api/auth/register', data),

  getMe: () =>
    api.get('/api/auth/me'),
};

// Products
export const productsAPI = {
  getAll: () =>
    api.get('/api/products'),

  getById: (id) =>
    api.get(`/api/products/${id}`),

  search: (query) =>
    api.get(`/api/products/search?q=${encodeURIComponent(query)}`),
};

// SECURE: Sign request with HMAC
const HMAC_SHARED_SECRET = "securityshop-hmac-secret-2024";

async function signOrderBody(orderBody) {
  const timestamp = new Date().toISOString();
  const sortedObj = Object.keys(orderBody).sort().reduce((acc, k) => { acc[k] = orderBody[k]; return acc; }, {});
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

// Orders
export const ordersAPI = {
  getAll: () =>
    api.get('/api/orders'),

  getById: (id) =>
    api.get(`/api/orders/${id}`),

  create: async (data) => {
    let mode = "base";
    try {
      const modeRes = await api.get('/api/mode');
      mode = modeRes.data.mode;
    } catch (_) {  }

    if (mode === "secure") {
      // SECURE: Sign request body before sending
      const { signature, timestamp } = await signOrderBody(data);
      return api.post('/api/orders', data, {
        headers: {
          "X-Signature": signature,
          "X-Timestamp": timestamp,
        },
      });
    }
    // BASE: Vulnerability - No signature, server trusts any data sent
    return api.post('/api/orders', data);
  },
};


// Payments
export const paymentsAPI = {
  getCards: () =>
    api.get('/api/payments'),

  addCard: (data) =>
    api.post('/api/payments', data),
};

// Reviews
export const reviewsAPI = {
  create: (data) =>
    api.post('/api/reviews', data),
};

// Chatbot
export const chatAPI = {
  send: (message, productId = null) =>
    api.post('/api/chat', { message, product_id: productId }),
};

// Mode
export const modeAPI = {
  getMode: () =>
    api.get('/api/mode'),

  setMode: (mode) =>
    api.post('/api/mode', { mode }),
};

// Shipper
export const shipperAPI = {
  getOrder: (id) =>
    api.get(`/api/orders/shipper/${id}`),

  updateStatus: (id, status) =>
    api.put(`/api/orders/shipper/${id}/status`, { status }),
};

export default api;

