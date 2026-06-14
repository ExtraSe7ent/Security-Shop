import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';
window.BACKEND_URL = API_BASE_URL; // Expose globally for easy F12 Console demos on public cloud

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses (expired/invalid token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Don't redirect here — let the component handle it
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    api.post('/api/auth/login', { email, password }),

  register: (data) =>
    api.post('/api/auth/register', data),

  getMe: () =>
    api.get('/api/auth/me'),
};

// ─── Products ───────────────────────────────────────────────────
export const productsAPI = {
  getAll: () =>
    api.get('/api/products'),

  // Returns { product, reviews } in one response
  getById: (id) =>
    api.get(`/api/products/${id}`),

  search: (query) =>
    api.get(`/api/products/search?q=${encodeURIComponent(query)}`),
};

// ─── HMAC Request Signing (SECURE MODE — Layer 4) ───────────────────────
// Mirrors the server-side logic in security.py: generate_order_hmac()
// Uses Web Crypto API (built-in browser API, no external library needed)
const HMAC_SHARED_SECRET = "securityshop-hmac-secret-2024";

async function signOrderBody(orderBody) {
  const timestamp = new Date().toISOString();
  // Canonical form: sorted-key JSON + "|" + timestamp (must match backend)
  const canonical = JSON.stringify(
    Object.keys(orderBody).sort().reduce((acc, k) => { acc[k] = orderBody[k]; return acc; }, {})
  ) + "|" + timestamp;

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

// ─── Orders ─────────────────────────────────────────────────────
export const ordersAPI = {
  getAll: () =>
    api.get('/api/orders'),

  getById: (id) =>
    api.get(`/api/orders/${id}`),

  create: async (data) => {
    // Detect current mode to decide whether to sign the request
    let mode = "base";
    try {
      const modeRes = await api.get('/api/mode');
      mode = modeRes.data.mode;
    } catch (_) { /* ignore — fallback to base */ }

    if (mode === "secure") {
      // SECURE: Sign the request body before sending
      const { signature, timestamp } = await signOrderBody(data);
      return api.post('/api/orders', data, {
        headers: {
          "X-Signature": signature,
          "X-Timestamp": timestamp,
        },
      });
    }
    // BASE (VULNERABLE): No signature — server trusts whatever we send
    return api.post('/api/orders', data);
  },
};


// ─── Payments ───────────────────────────────────────────────────
export const paymentsAPI = {
  getCards: () =>
    api.get('/api/payments'),

  addCard: (data) =>
    api.post('/api/payments', data),
};

// ─── Reviews ────────────────────────────────────────────────────
export const reviewsAPI = {
  create: (data) =>
    api.post('/api/reviews', data),
};

// ─── Chatbot ────────────────────────────────────────────────────
export const chatAPI = {
  send: (message, productId = null) =>
    api.post('/api/chat', { message, product_id: productId }),
};

// ─── Mode ───────────────────────────────────────────────────────
export const modeAPI = {
  getMode: () =>
    api.get('/api/mode'),

  setMode: (mode) =>
    api.post('/api/mode', { mode }),
};

// ─── Shipper (MitM Defense Demo) ────────────────────────────────
export const shipperAPI = {
  getOrder: (id) =>
    api.get(`/api/orders/shipper/${id}`),

  updateStatus: (id, status) =>
    api.put(`/api/orders/shipper/${id}/status`, { status }),
};

export default api;

