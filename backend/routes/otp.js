const express = require('express');
const router = express.Router();
const OtpSession = require('../models/OtpSession');

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

// POST /api/otp/send  { phone }
router.post('/send', async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    if (phone.length !== 10) {
      return res.status(400).json({ error: 'Enter a valid 10-digit phone number' });
    }
    const otp = genOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await OtpSession.create({ phone, otp, expiresAt });

    // --- DEMO MODE ---
    // No SMS provider is wired in, so the OTP is returned directly in the
    // API response (devOtp) purely so the flow works end-to-end without a
    // paid SMS account. Go live by calling a real provider here (MSG91,
    // Twilio, 2Factor, etc.) and removing devOtp from the response - see
    // README "Going live: OTP / SMS".
    res.json({ success: true, message: 'OTP sent', devOtp: otp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/otp/verify { phone, otp }
router.post('/verify', async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
    const { otp } = req.body;
    const session = await OtpSession.findOne({ phone, verified: false }).sort('-createdAt');
    if (!session) return res.status(400).json({ error: 'No OTP request found. Please resend OTP.' });
    if (session.expiresAt < new Date()) {
      return res.status(400).json({ error: 'OTP expired. Please resend.' });
    }
    session.attempts += 1;
    if (session.attempts > 5) {
      await session.save();
      return res.status(429).json({ error: 'Too many incorrect attempts. Please resend OTP.' });
    }
    if (session.otp !== String(otp)) {
      await session.save();
      return res.status(400).json({ error: 'Incorrect OTP' });
    }
    session.verified = true;
    await session.save();
    res.json({ success: true, message: 'Phone number verified' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
