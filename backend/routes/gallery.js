const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');
const requireAdmin = require('../middleware/adminAuth');

// GET /api/gallery?category=classroom -> active photos, in display order
router.get('/', async (req, res) => {
  try {
    const filter = { active: true };
    if (req.query.category) filter.category = req.query.category;
    const items = await Gallery.find(filter).sort('displayOrder');
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/gallery (admin, x-admin-key header)
// body: { title, imageUrl, category, courseSlug, displayOrder }
router.post('/', requireAdmin, async (req, res) => {
  try {
    const item = await Gallery.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/gallery/:id (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const item = await Gallery.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/gallery/:id (admin) - soft delete
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Gallery.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
