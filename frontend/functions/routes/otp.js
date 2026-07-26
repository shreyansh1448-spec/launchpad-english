import { Hono } from 'hono';

const app = new Hono();

const OTP_TTL_MS = 5 * 60 * 1000; // logical expiry shown to the user
const KV_TTL_SECONDS = 10 * 60; // key outlives logical expiry so "expired" (vs "never sent") can still be reported
const VERIFIED_TTL_SECONDS = 24 * 60 * 60; // once verified, survive long enough for checkout (payment.js) to consume it

function genOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

function kvKey(phone) {
  return `otp:${phone}`;
}

// POST /api/otp/send  { phone }
app.post('/send', async (c) => {
  try {
    const body = await c.req.json();
    const phone = normalizePhone(body.phone);
    if (phone.length !== 10) {
      return c.json({ error: 'Enter a valid 10-digit phone number' }, 400);
    }
    const otp = genOtp();
    const session = { otp, verified: false, attempts: 0, expiresAt: Date.now() + OTP_TTL_MS };
    await c.env.OTP_KV.put(kvKey(phone), JSON.stringify(session), { expirationTtl: KV_TTL_SECONDS });

    // --- DEMO MODE ---
    // No SMS provider is wired in, so the OTP is returned directly in the
    // API response (devOtp) purely so the flow works end-to-end without a
    // paid SMS account. Go live by calling a real provider here and
    // removing devOtp from the response.
    return c.json({ success: true, message: 'OTP sent', devOtp: otp });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/otp/verify { phone, otp }
app.post('/verify', async (c) => {
  try {
    const body = await c.req.json();
    const phone = normalizePhone(body.phone);
    const otp = body.otp;

    const raw = await c.env.OTP_KV.get(kvKey(phone));
    if (!raw) return c.json({ error: 'No OTP request found. Please resend OTP.' }, 400);
    const session = JSON.parse(raw);

    if (session.verified) return c.json({ success: true, message: 'Phone number verified' });
    if (session.expiresAt < Date.now()) {
      return c.json({ error: 'OTP expired. Please resend.' }, 400);
    }

    session.attempts += 1;
    if (session.attempts > 5) {
      await c.env.OTP_KV.put(kvKey(phone), JSON.stringify(session), { expirationTtl: KV_TTL_SECONDS });
      return c.json({ error: 'Too many incorrect attempts. Please resend OTP.' }, 429);
    }
    if (session.otp !== String(otp)) {
      await c.env.OTP_KV.put(kvKey(phone), JSON.stringify(session), { expirationTtl: KV_TTL_SECONDS });
      return c.json({ error: 'Incorrect OTP' }, 400);
    }

    session.verified = true;
    await c.env.OTP_KV.put(kvKey(phone), JSON.stringify(session), { expirationTtl: VERIFIED_TTL_SECONDS });
    return c.json({ success: true, message: 'Phone number verified' });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
