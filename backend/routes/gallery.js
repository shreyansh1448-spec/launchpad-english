const express = require('express');
const router = express.Router();
const Gallery = require('../models/Gallery');
const requireAdmin = require('../middleware/adminAuth');
const upload = require('../middleware/galleryUpload');

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

// POST /api/gallery/upload (admin, multipart field "file") - uploads a photo
// or video straight from disk instead of pasting an external URL. Returns
// { url, mediaType } so the admin form can drop it straight into the
// imageUrl/videoUrl field. Served statically from /uploads/gallery/...
router.post('/upload', requireAdmin, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
  const url = `/uploads/gallery/${req.file.filename}`;
  res.status(201).json({ url, mediaType });
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
