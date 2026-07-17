const express = require('express');
const router = express.Router();
const SiteContent = require('../models/SiteContent');
const requireAdmin = require('../middleware/adminAuth');

// GET /api/site-content -> the singleton doc (auto-created with sensible
// defaults on first request, including the launchpadenglish.com address and
// the intro-video hero slide).
router.get('/', async (req, res) => {
  try {
    let content = await SiteContent.findOne();
    if (!content) content = await SiteContent.create({});
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/site-content (admin, x-admin-key header) - update any subset of
// fields (hero slides, about text, phone/email/address, map location,
// stats). This is how the homepage photos/video/copy are database-managed.
router.put('/', requireAdmin, async (req, res) => {
  try {
    let content = await SiteContent.findOne();
    if (!content) content = new SiteContent();
    Object.assign(content, req.body);
    await content.save();
    res.json(content);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
