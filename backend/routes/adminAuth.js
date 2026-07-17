const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Admin = require('../models/Admin');
const requireAdmin = require('../middleware/adminAuth');

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const TOKEN_TTL = '7d';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function signToken(admin) {
  return jwt.sign({ adminId: admin._id }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// POST /api/admin/login { email, password } -> { token, email }
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) return res.status(401).json({ error: 'Incorrect email or password' });

    const match = await bcrypt.compare(password, admin.passwordHash);
    if (!match) return res.status(401).json({ error: 'Incorrect email or password' });

    res.json({ token: signToken(admin), email: admin.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/me (auth required) -> the logged-in admin's email
router.get('/me', requireAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });
    res.json({ email: admin.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/forgot-password { email } -> generates a reset token.
// No real email provider is configured (same as the OTP flow - see
// routes/otp.js), so this is demo mode: the token is returned directly in
// the response as `devResetToken` instead of being emailed. Wire in a real
// email provider (SendGrid, Postmark, SES, etc.) here to send it for real -
// remove `devResetToken` from the response once you do.
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    // Always respond the same way whether or not the email exists, so this
    // endpoint can't be used to discover which emails have admin accounts.
    if (!admin) return res.json({ ok: true });

    const token = crypto.randomBytes(32).toString('hex');
    admin.resetTokenHash = hashToken(token);
    admin.resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await admin.save();

    res.json({ ok: true, devResetToken: token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/reset-password { token, newPassword }
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const admin = await Admin.findOne({ resetTokenHash: hashToken(token) });
    if (!admin || !admin.resetTokenExpiry || admin.resetTokenExpiry < new Date()) {
      return res.status(400).json({ error: 'Reset link is invalid or has expired' });
    }

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    admin.resetTokenHash = '';
    admin.resetTokenExpiry = null;
    await admin.save();

    res.json({ token: signToken(admin), email: admin.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/change-email (auth required) { currentPassword, newEmail }
router.put('/change-email', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newEmail } = req.body;
    if (!currentPassword || !newEmail) {
      return res.status(400).json({ error: 'Current password and new email are required' });
    }

    const admin = await Admin.findById(req.adminId);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const match = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

    const normalized = newEmail.toLowerCase().trim();
    const existing = await Admin.findOne({ email: normalized, _id: { $ne: admin._id } });
    if (existing) return res.status(400).json({ error: 'That email is already in use' });

    admin.email = normalized;
    await admin.save();
    res.json({ email: admin.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/change-password (auth required) { currentPassword, newPassword }
router.put('/change-password', requireAdmin, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }
    if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

    const admin = await Admin.findById(req.adminId);
    if (!admin) return res.status(404).json({ error: 'Admin not found' });

    const match = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    await admin.save();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
