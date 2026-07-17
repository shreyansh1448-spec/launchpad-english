const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const requireAdmin = require('../middleware/adminAuth');

// GET /api/reviews?courseSlug=xxx -> list reviews (all courses if omitted)
router.get('/', async (req, res) => {
  try {
    const filter = { approved: true };
    if (req.query.courseSlug) filter.courseSlug = req.query.courseSlug;
    const reviews = await Review.find(filter).sort('-featured -createdAt');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/admin/all -> admin only, every review incl. unapproved
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const reviews = await Review.find({}).sort('-createdAt');
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews/admin (admin) - add a review directly from the backend,
// with no verified-purchase Order required. For importing existing
// testimonials or logging a walk-in customer's feedback.
// body: { courseSlug, name, role, stars, text, photoUrl, approved, featured }
router.post('/admin', requireAdmin, async (req, res) => {
  try {
    const { courseSlug, name, role, stars, text, photoUrl, approved, featured } = req.body;
    if (!courseSlug || !name || !stars) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const starsNum = Number(stars);
    if (starsNum < 1 || starsNum > 5) {
      return res.status(400).json({ error: 'Stars must be between 1 and 5' });
    }
    const review = await Review.create({
      source: 'admin',
      courseSlug,
      name,
      role: role || '',
      stars: starsNum,
      text: text || '',
      photoUrl: photoUrl || '',
      approved: approved === undefined ? true : !!approved,
      featured: !!featured,
    });
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/reviews/:id (admin) - approve/hide (reject), edit, and feature.
// Only an explicit allow-list of fields is ever written.
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const update = {};
    if ('approved' in req.body) update.approved = !!req.body.approved;
    if ('featured' in req.body) update.featured = !!req.body.featured;
    if ('name' in req.body) update.name = req.body.name;
    if ('role' in req.body) update.role = req.body.role;
    if ('text' in req.body) update.text = req.body.text;
    if ('stars' in req.body) {
      const stars = Number(req.body.stars);
      if (stars < 1 || stars > 5) return res.status(400).json({ error: 'Stars must be between 1 and 5' });
      update.stars = stars;
    }
    const review = await Review.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!review) return res.status(404).json({ error: 'Review not found' });
    res.json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/reviews/:id (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews
// body: { orderId, courseSlug, name, stars, text, photoUrl }
// Only accepted if orderId references a *paid* Order for that courseSlug -
// this is what gates review-writing to verified purchasers. photoUrl is
// optional (base64 data URL from the browser, or a hosted image URL).
router.post('/', async (req, res) => {
  try {
    const { orderId, courseSlug, name, stars, text, photoUrl } = req.body;
    if (!orderId || !courseSlug || !name || !stars || !text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (stars < 1 || stars > 5) {
      return res.status(400).json({ error: 'Stars must be between 1 and 5' });
    }
    const order = await Order.findOne({ _id: orderId, courseSlug, status: 'paid' });
    if (!order) {
      return res.status(403).json({ error: 'Only verified purchasers of this course can post a review' });
    }
    const review = await Review.create({
      order: order._id,
      courseSlug,
      name,
      stars,
      text,
      photoUrl: photoUrl || '',
    });
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
