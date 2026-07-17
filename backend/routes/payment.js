const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const razorpay = require('../utils/razorpay');
const Course = require('../models/Course');
const Order = require('../models/Order');
const OtpSession = require('../models/OtpSession');
const requireAdmin = require('../middleware/adminAuth');

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

// POST /api/payment/create-order
// body: { courseSlug, mode: 'online'|'offline', name, phone, email, address }
// Creates a Razorpay order for the course's current DB price and a matching
// local Order record (status: created). Requires the phone to already be
// OTP-verified (see routes/otp.js).
router.post('/create-order', async (req, res) => {
  try {
    const { courseSlug, mode, name, email, address } = req.body;
    const phone = normalizePhone(req.body.phone);

    if (!courseSlug || !mode || !name || !phone || !email || !address) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!['online', 'offline'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    const phoneSession = await OtpSession.findOne({ phone, verified: true }).sort('-createdAt');
    if (!phoneSession) {
      return res.status(400).json({ error: 'Phone number is not OTP-verified' });
    }

    const course = await Course.findOne({ slug: courseSlug, active: true });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const amountRupees = course.pricing[mode].offer;
    const amountPaise = Math.round(amountRupees * 100);

    const rpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `lpe_${Date.now()}`,
      notes: { courseSlug, mode, name, phone },
    });

    const order = await Order.create({
      name,
      phone,
      phoneVerified: true,
      email,
      address,
      courseSlug,
      courseTitle: course.title,
      mode,
      amount: amountPaise,
      razorpayOrderId: rpOrder.id,
      status: 'created',
    });

    res.json({
      orderId: order._id,
      razorpayOrderId: rpOrder.id,
      amount: amountPaise,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXX',
      courseTitle: course.title,
      name,
      email,
      phone,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/verify
// body: { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
// Verifies the HMAC signature Razorpay returns after checkout, exactly as
// Razorpay's docs specify, then marks the Order paid.
router.post('/verify', async (req, res) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'REPLACE_WITH_TEST_SECRET';
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (expected !== razorpay_signature) {
      order.status = 'failed';
      await order.save();
      return res.status(400).json({ error: 'Payment verification failed' });
    }

    order.status = 'paid';
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpaySignature = razorpay_signature;
    await order.save();

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payment/my-orders?phone=&email= -> paid orders matching phone OR
// email. The frontend uses this to gate review-writing to real purchasers.
router.get('/my-orders', async (req, res) => {
  try {
    const phone = normalizePhone(req.query.phone);
    const email = (req.query.email || '').trim().toLowerCase();
    if (!phone && !email) return res.json([]);

    const or = [];
    if (phone) or.push({ phone });
    if (email) or.push({ email: new RegExp(`^${email}$`, 'i') });

    const orders = await Order.find({ status: 'paid', $or: or }).sort('-createdAt');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payment/admin/orders?search= (admin) -> all orders, newest first,
// optionally filtered by a phone/email/course-title/slug substring match.
router.get('/admin/orders', requireAdmin, async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const filter = search
      ? {
          $or: [
            { phone: new RegExp(search, 'i') },
            { email: new RegExp(search, 'i') },
            { name: new RegExp(search, 'i') },
            { courseTitle: new RegExp(search, 'i') },
            { courseSlug: new RegExp(search, 'i') },
          ],
        }
      : {};
    const orders = await Order.find(filter).sort('-createdAt').limit(500);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/admin/manual-order (admin) -> record a walk-in / cash
// payment directly as a paid Order, without going through Razorpay. Lets the
// front desk log a student who paid cash so they still show up in Orders and
// can write a verified review for the course.
router.post('/admin/manual-order', requireAdmin, async (req, res) => {
  try {
    const { name, email, address, courseSlug, mode, amount, notes } = req.body;
    const phone = normalizePhone(req.body.phone);

    if (!name || !phone || !email || !courseSlug || !mode) {
      return res.status(400).json({ error: 'Name, phone, email, course and mode are required' });
    }
    if (!['online', 'offline'].includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    const course = await Course.findOne({ slug: courseSlug });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const amountRupees = amount !== undefined && amount !== null && amount !== '' ? Number(amount) : course.pricing[mode].offer;
    if (!Number.isFinite(amountRupees) || amountRupees < 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const order = await Order.create({
      name,
      phone,
      phoneVerified: true,
      email,
      address: address || '',
      courseSlug,
      courseTitle: course.title,
      mode,
      amount: Math.round(amountRupees * 100),
      currency: 'INR',
      paymentMethod: 'cash',
      status: 'paid',
      notes: notes || '',
    });

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/payment/admin/orders/:id/notes (admin) -> update the free-text
// notes field on a student's order.
router.put('/admin/orders/:id/notes', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { notes: req.body.notes || '' }, { new: true });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
