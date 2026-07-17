const Razorpay = require('razorpay');

// Test-mode placeholder credentials. Replace RAZORPAY_KEY_ID and
// RAZORPAY_KEY_SECRET in backend/.env with your real Razorpay keys
// (Dashboard -> Settings -> API Keys) before going live. Never commit real
// keys to source control.
const instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXX',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'REPLACE_WITH_TEST_SECRET',
});

module.exports = instance;
