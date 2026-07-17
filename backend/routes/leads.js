const express = require('express');
const router = express.Router();
const ContactLead = require('../models/ContactLead');
const requireAdmin = require('../middleware/adminAuth');

// POST /api/leads
// body: { type: 'contact'|'counselling', name, phone, email, courseType, message }
router.post('/', async (req, res) => {
  try {
    const { type, name, phone } = req.body;
    if (!type || !name || !phone) {
      return res.status(400).json({ error: 'type, name and phone are required' });
    }
    const lead = await ContactLead.create(req.body);
    res.status(201).json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/leads (admin) -> all contact/counselling leads, newest first
router.get('/', requireAdmin, async (req, res) => {
  try {
    const leads = await ContactLead.find({}).sort('-createdAt');
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
