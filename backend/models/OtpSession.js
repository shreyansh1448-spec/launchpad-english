const mongoose = require('mongoose');

// Short-lived OTP session for phone verification during registration.
// In demo mode the OTP is generated here and returned in the API response
// (see routes/otp.js) so the flow works end-to-end with zero external
// dependency. Wire in a real SMS provider (MSG91 / Twilio / 2Factor) inside
// routes/otp.js to go live - see README "Going live".
const OtpSessionSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    otp: { type: String, required: true },
    verified: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OtpSession', OtpSessionSchema);
