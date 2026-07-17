const mongoose = require('mongoose');

// A review normally references a *paid* Order, proving the reviewer
// actually purchased the course before they're allowed to post. Admins can
// also add a review directly from the backend/admin panel (e.g. importing an
// existing testimonial, or logging a walk-in customer's feedback) - those
// have no order and are marked source: 'admin'. Photo is optional - stored
// as a base64 data URL (demo) or a hosted URL (production, e.g. S3 /
// Cloudinary). All reviews live in this collection, so moderating, editing
// or deleting a review is just a DB operation - the site reflects it
// immediately, no code change required.
const ReviewSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    source: { type: String, enum: ['purchase', 'admin'], default: 'purchase' },
    courseSlug: { type: String, required: true, index: true },
    name: { type: String, required: true },
    role: { type: String, default: '' }, // optional occupation/title shown under the name, e.g. "BPSC Account Officer"
    stars: { type: Number, min: 1, max: 5, required: true },
    // Required for purchase-flow submissions (enforced in the route), but
    // optional for admin-added photo-only testimonials (no written quote).
    text: { type: String, default: '' },
    photoUrl: { type: String, default: '' }, // optional
    // Optional override for the date shown on the public site - lets admins
    // backdate imported testimonials to their real original date instead of
    // the moment they were entered. Falls back to createdAt when unset.
    reviewDate: { type: Date },
    approved: { type: Boolean, default: true },
    featured: { type: Boolean, default: false }, // shown first in the Home page review list
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', ReviewSchema);
