const mongoose = require('mongoose');

// One Order = one registration + payment attempt for a course.
// A "verified purchase" (status: paid) is what unlocks review-writing for
// that name/phone/email + course combination - see routes/reviews.js.
const OrderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    phoneVerified: { type: Boolean, default: false },
    email: { type: String, required: true },
    address: { type: String, default: '' },

    courseSlug: { type: String, required: true, index: true },
    courseTitle: { type: String, required: true },
    mode: { type: String, enum: ['online', 'offline'], required: true },

    amount: { type: Number, required: true }, // in paise (Razorpay unit)
    currency: { type: String, default: 'INR' },

    // 'razorpay' = paid through the online checkout flow; 'cash' = a
    // walk-in/offline payment an admin recorded manually (see
    // POST /api/payment/admin/manual-order).
    paymentMethod: { type: String, enum: ['razorpay', 'cash'], default: 'razorpay' },

    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },

    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
    },

    notes: { type: String, default: '' }, // free-text admin notes on this student/order
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
