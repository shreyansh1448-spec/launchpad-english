const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const Course = require('../models/Course');
const requireAdmin = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

// GET /api/courses -> list of active courses, sorted for display
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ active: true }).sort('displayOrder');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/admin/all -> admin only, every course incl. inactive ones
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const courses = await Course.find({}).sort('displayOrder');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:slug
router.get('/:slug', async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug, active: true });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses -> admin only, create a brand new course. slug must be
// unique; required fields (title, tagline, duration, overview, pricing.
// online/offline) are enforced by the schema.
router.post('/', requireAdmin, async (req, res) => {
  try {
    if (!req.body.slug) return res.status(400).json({ error: 'slug is required' });
    const existing = await Course.findOne({ slug: req.body.slug });
    if (existing) return res.status(400).json({ error: 'A course with this slug already exists' });
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/courses/:slug -> admin only. This is how pricing/content changes
// ("the database") without touching frontend code. Send any subset of
// Course fields in the body, e.g. { "pricing": { "online": { "mrp": 18000,
// "offer": 15000 }, "offline": { "mrp": 18000, "offer": 15000 } } }
router.put('/:slug', requireAdmin, async (req, res) => {
  try {
    const course = await Course.findOneAndUpdate(
      { slug: req.params.slug },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses/:slug/resources -> admin only, upload one PDF (multipart
// form field "file") with a "title" field (e.g. "Brochure", "Syllabus PDF").
// Appends to the course's resources list; the file is served statically from
// /uploads/resources/:slug/...
router.post('/:slug/resources', requireAdmin, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No PDF file uploaded' });
    if (!req.body.title) return res.status(400).json({ error: 'title is required' });

    const course = await Course.findOne({ slug: req.params.slug });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const url = `/uploads/resources/${req.params.slug}/${req.file.filename}`;
    course.resources.push({ title: req.body.title, url });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/courses/:slug/resources/:resourceId -> admin only, removes the
// resource entry and deletes the file from disk.
router.delete('/:slug/resources/:resourceId', requireAdmin, async (req, res) => {
  try {
    const course = await Course.findOne({ slug: req.params.slug });
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const resource = course.resources.id(req.params.resourceId);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    const filePath = path.join(__dirname, '..', resource.url.replace(/^\/uploads\//, 'uploads/'));
    fs.unlink(filePath, () => {}); // best-effort - resource entry is removed regardless

    course.resources.pull(req.params.resourceId);
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
