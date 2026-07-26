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


export const api = {
  getCourses: () => request('/courses'),
  getCourse: (slug) => request(`/courses/${slug}`),

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

  submitLead: (payload) => request('/leads', { method: 'POST', body: JSON.stringify(payload) }),

  getGallery: (category) => request(`/gallery${category ? `?category=${encodeURIComponent(category)}` : ''}`),

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

    listCourses: () => adminRequest('/courses/admin/all'),
    createCourse: (payload) => adminRequest('/courses', { method: 'POST', body: JSON.stringify(payload) }),
    updateCourse: (slug, payload) => adminRequest(`/courses/${slug}`, { method: 'PUT', body: JSON.stringify(payload) }),
    // PDFs are read client-side and sent as a base64 data URL (JSON), rather
    // than multipart to disk - Vercel's serverless filesystem is read-only,
    // so on-disk uploads aren't an option there. Capped at 3MB.
    uploadResource: (slug, title, file) => {
      if (file.size > 3 * 1024 * 1024) return Promise.reject(new Error('PDF must be under 3MB'));
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () =>
          adminRequest(`/courses/${slug}/resources`, {
            method: 'POST',
            body: JSON.stringify({ title, dataUrl: reader.result }),
          })
            .then(resolve)
            .catch(reject);
        reader.onerror = () => reject(new Error('Could not read file'));
        reader.readAsDataURL(file);
      });
    },
    deleteResource: (slug, resourceId) => adminRequest(`/courses/${slug}/resources/${resourceId}`, { method: 'DELETE' }),

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

    listOrders: (search) => adminRequest(`/payment/admin/orders${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    updateOrderNotes: (id, notes) => adminRequest(`/payment/admin/orders/${id}/notes`, { method: 'PUT', body: JSON.stringify({ notes }) }),
    createManualOrder: (payload) => adminRequest('/payment/admin/manual-order', { method: 'POST', body: JSON.stringify(payload) }),
  },
};
