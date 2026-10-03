import { trackLeadConversion } from './lib/ads.js';

// Same-origin: Pages Functions serve /api/* on the same domain as the
// frontend, so no absolute base URL (and no VITE_API_URL) is needed. Kept
// overridable for local dev against `wrangler pages dev` on a different port.
const API_URL = import.meta.env.VITE_API_URL || '/api';

// D1-backed rows now always store full, absolute media URLs (external URLs
// or ones already pointed at their final host) - kept as a passthrough for
// any component still calling it.
export function resolveMediaUrl(url) {
  return url;
}
const ADMIN_TOKEN_STORAGE = 'lpe_admin_token';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

// Admin requests attach the session token (from logging in with email +
// password) from sessionStorage (cleared when the browser tab closes) as a
// Bearer token the backend verifies (see middleware/adminAuth.js).
function getAdminToken() {
  return sessionStorage.getItem(ADMIN_TOKEN_STORAGE) || '';
}
function setAdminToken(token) {
  sessionStorage.setItem(ADMIN_TOKEN_STORAGE, token);
}
function clearAdminToken() {
  sessionStorage.removeItem(ADMIN_TOKEN_STORAGE);
}
function adminRequest(path, options = {}) {
  return request(path, { ...options, headers: { Authorization: `Bearer ${getAdminToken()}`, ...(options.headers || {}) } });
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export const api = {
  getCourses: (mode) => request(`/courses${mode ? `?mode=${encodeURIComponent(mode)}` : ''}`),
  getCourse: (slug) => request(`/courses/${encodeURIComponent(slug)}`),
  getBatches: (mode) => request(`/batches${mode ? `?mode=${encodeURIComponent(mode)}` : ''}`),

  sendOtp: (phone) => request('/otp/send', { method: 'POST', body: JSON.stringify({ phone }) }),
  verifyOtp: (phone, otp) => request('/otp/verify', { method: 'POST', body: JSON.stringify({ phone, otp }) }),

  createOrder: (payload) => request('/payment/create-order', { method: 'POST', body: JSON.stringify(payload) }),
  verifyPayment: (payload) => request('/payment/verify', { method: 'POST', body: JSON.stringify(payload) }),
  myOrders: (phone, email) =>
    request(`/payment/my-orders?phone=${encodeURIComponent(phone || '')}&email=${encodeURIComponent(email || '')}`),

  getReviews: (courseSlug) => request(`/reviews${courseSlug ? `?courseSlug=${encodeURIComponent(courseSlug)}` : ''}`),
  postReview: (payload) => request('/reviews', { method: 'POST', body: JSON.stringify(payload) }),
  getReviewByOrder: (orderId) => request(`/reviews/by-order/${orderId}`),
  putReview: (orderId, payload) => request(`/reviews/by-order/${orderId}`, { method: 'PUT', body: JSON.stringify(payload) }),

  // Every lead form (counselling popup, Counselling page, Contact page) goes
  // through here, so the Google Ads lead conversion fires only on success.
  submitLead: async (payload) => {
    const data = await request('/leads', { method: 'POST', body: JSON.stringify(payload) });
    trackLeadConversion();
    return data;
  },

  getGallery: (category) => request(`/gallery${category ? `?category=${encodeURIComponent(category)}` : ''}`),

  getBlogPosts: (page = 1) => request(`/blog?page=${encodeURIComponent(page)}`),
  getBlogPost: (slug) => request(`/blog/${slug}`),

  getSiteContent: () => request('/site-content'),

  // --- Admin (all require the session token from logging in, stored via setAdminToken) ---
  admin: {
    getAdminToken,
    setAdminToken,
    clearAdminToken,
    login: (email, password) => request('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    me: () => adminRequest('/admin/me'),
    forgotPassword: (email) => request('/admin/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token, newPassword) =>
      request('/admin/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),
    changeEmail: (currentPassword, newEmail) =>
      adminRequest('/admin/change-email', { method: 'PUT', body: JSON.stringify({ currentPassword, newEmail }) }),
    changePassword: (currentPassword, newPassword) =>
      adminRequest('/admin/change-password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),

    getDashboard: () => adminRequest('/dashboard'),

    listCourses: () => adminRequest('/courses/admin/all'),
    getCourse: (id) => adminRequest(`/courses/admin/id/${id}`),
    createCourse: (payload) => adminRequest('/courses', { method: 'POST', body: JSON.stringify(payload) }),
    updateCourse: (id, payload) => adminRequest(`/courses/admin/id/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    duplicateCourse: (id) => adminRequest(`/courses/admin/id/${id}/duplicate`, { method: 'POST' }),
    deleteCourse: (id) => adminRequest(`/courses/admin/id/${id}`, { method: 'DELETE' }),
    // PDFs are read client-side and sent as a base64 data URL (JSON). Capped at 3MB.
    uploadResource: (id, title, file) => {
      if (file.size > 3 * 1024 * 1024) return Promise.reject(new Error('PDF must be under 3MB'));
      return readAsDataUrl(file).then((dataUrl) =>
        adminRequest(`/courses/admin/id/${id}/resources`, { method: 'POST', body: JSON.stringify({ title, dataUrl }) })
      );
    },
    deleteResource: (id, resourceId) => adminRequest(`/courses/admin/id/${id}/resources/${resourceId}`, { method: 'DELETE' }),

    listBatches: (courseId) => adminRequest(`/batches/admin/all${courseId ? `?courseId=${encodeURIComponent(courseId)}` : ''}`),
    createBatch: (payload) => adminRequest('/batches', { method: 'POST', body: JSON.stringify(payload) }),
    updateBatch: (id, payload) => adminRequest(`/batches/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteBatch: (id) => adminRequest(`/batches/${id}`, { method: 'DELETE' }),

    // Images are resized in the browser first (see lib/image.js), then stored
    // in D1 and served from /api/media/:id.
    uploadMedia: (dataUrl, filename) => adminRequest('/media', { method: 'POST', body: JSON.stringify({ dataUrl, filename }) }),

    getSiteContent: () => request('/site-content'),
    updateSiteContent: (payload) => adminRequest('/site-content', { method: 'PUT', body: JSON.stringify(payload) }),

    listGallery: () => request('/gallery'),
    createGalleryItem: (payload) => adminRequest('/gallery', { method: 'POST', body: JSON.stringify(payload) }),
    updateGalleryItem: (id, payload) => adminRequest(`/gallery/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteGalleryItem: (id) => adminRequest(`/gallery/${id}`, { method: 'DELETE' }),

    listReviews: () => adminRequest('/reviews/admin/all'),
    createReview: (payload) => adminRequest('/reviews/admin', { method: 'POST', body: JSON.stringify(payload) }),
    setReviewApproved: (id, approved) => adminRequest(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify({ approved }) }),
    updateReview: (id, payload) => adminRequest(`/reviews/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteReview: (id) => adminRequest(`/reviews/${id}`, { method: 'DELETE' }),

    listLeads: () => adminRequest('/leads'),

    // filters: { search, mode, course, status }
    listOrders: (filters = {}) => {
      const qs = new URLSearchParams(Object.entries(filters).filter(([, v]) => v)).toString();
      return adminRequest(`/payment/admin/orders${qs ? `?${qs}` : ''}`);
    },
    updateOrderNotes: (id, notes) => adminRequest(`/payment/admin/orders/${id}/notes`, { method: 'PUT', body: JSON.stringify({ notes }) }),
    createManualOrder: (payload) => adminRequest('/payment/admin/manual-order', { method: 'POST', body: JSON.stringify(payload) }),

    listBlogPosts: (page = 1, search = '') =>
      adminRequest(`/blog/admin/all?page=${encodeURIComponent(page)}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
    createBlogPost: (payload) => adminRequest('/blog', { method: 'POST', body: JSON.stringify(payload) }),
    updateBlogPost: (slug, payload) => adminRequest(`/blog/${slug}`, { method: 'PUT', body: JSON.stringify(payload) }),
    deleteBlogPost: (slug) => adminRequest(`/blog/${slug}`, { method: 'DELETE' }),
  },
};
