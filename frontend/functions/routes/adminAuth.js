import { Hono } from 'hono';
import { requireAdmin, signToken } from '../lib/auth.js';
import { randomHex, sha256Hex, hashPassword, verifyPassword } from '../lib/crypto.js';
import { sendEmail } from '../lib/resend.js';

const app = new Hono();

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

async function sendResetEmail(env, toEmail, token) {
  await sendEmail(env, {
    to: toEmail,
    subject: 'Reset your Launch Pad English admin password',
    html: `
      <p>Someone requested a password reset for the Launch Pad English admin panel.</p>
      <p>Go to the admin login page, click "Forgot password?", and paste this reset token:</p>
      <p style="font-size:18px;font-weight:bold;letter-spacing:1px;">${token}</p>
      <p>This token expires in 1 hour. If you didn't request this, you can ignore this email.</p>
    `,
  });
}

// POST /api/admin/login { email, password } -> { token, email }
app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();
    if (!email || !password) return c.json({ error: 'Email and password are required' }, 400);

    const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE email = ?1')
      .bind(email.toLowerCase().trim())
      .first();
    if (!admin) return c.json({ error: 'Incorrect email or password' }, 401);

    const match = await verifyPassword(password, admin.password_hash, admin.password_salt);
    if (!match) return c.json({ error: 'Incorrect email or password' }, 401);

    return c.json({ token: await signToken(c.env, admin.id), email: admin.email });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/admin/me (auth required) -> the logged-in admin's email
app.get('/me', requireAdmin, async (c) => {
  try {
    const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE id = ?1').bind(c.get('adminId')).first();
    if (!admin) return c.json({ error: 'Admin not found' }, 404);
    return c.json({ email: admin.email });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/admin/forgot-password { email } -> generates a reset token.
app.post('/forgot-password', async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) return c.json({ error: 'Email is required' }, 400);

    const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE email = ?1')
      .bind(email.toLowerCase().trim())
      .first();
    // Always respond the same way whether or not the email exists, so this
    // endpoint can't be used to discover which emails have admin accounts.
    if (!admin) return c.json({ ok: true });

    const token = randomHex(32);
    const tokenHash = await sha256Hex(token);
    const expiry = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
    await c.env.DB.prepare(
      "UPDATE admins SET reset_token_hash = ?1, reset_token_expiry = ?2, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?3"
    )
      .bind(tokenHash, expiry, admin.id)
      .run();

    if (c.env.RESEND_API_KEY) {
      try {
        await sendResetEmail(c.env, admin.email, token);
      } catch (emailErr) {
        console.error('Failed to send reset email:', emailErr.message);
      }
      return c.json({ ok: true });
    }

    return c.json({ ok: true, devResetToken: token });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/admin/reset-password { token, newPassword }
app.post('/reset-password', async (c) => {
  try {
    const { token, newPassword } = await c.req.json();
    if (!token || !newPassword) return c.json({ error: 'Token and new password are required' }, 400);
    if (newPassword.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400);

    const tokenHash = await sha256Hex(token);
    const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE reset_token_hash = ?1').bind(tokenHash).first();
    if (!admin || !admin.reset_token_expiry || new Date(admin.reset_token_expiry) < new Date()) {
      return c.json({ error: 'Reset link is invalid or has expired' }, 400);
    }

    const { hash, salt } = await hashPassword(newPassword);
    await c.env.DB.prepare(
      "UPDATE admins SET password_hash = ?1, password_salt = ?2, reset_token_hash = '', reset_token_expiry = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?3"
    )
      .bind(hash, salt, admin.id)
      .run();

    return c.json({ token: await signToken(c.env, admin.id), email: admin.email });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT /api/admin/change-email (auth required) { currentPassword, newEmail }
app.put('/change-email', requireAdmin, async (c) => {
  try {
    const { currentPassword, newEmail } = await c.req.json();
    if (!currentPassword || !newEmail) {
      return c.json({ error: 'Current password and new email are required' }, 400);
    }

    const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE id = ?1').bind(c.get('adminId')).first();
    if (!admin) return c.json({ error: 'Admin not found' }, 404);

    const match = await verifyPassword(currentPassword, admin.password_hash, admin.password_salt);
    if (!match) return c.json({ error: 'Current password is incorrect' }, 401);

    const normalized = newEmail.toLowerCase().trim();
    const existing = await c.env.DB.prepare('SELECT id FROM admins WHERE email = ?1 AND id != ?2')
      .bind(normalized, admin.id)
      .first();
    if (existing) return c.json({ error: 'That email is already in use' }, 400);

    await c.env.DB.prepare("UPDATE admins SET email = ?1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?2")
      .bind(normalized, admin.id)
      .run();

    return c.json({ email: normalized });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT /api/admin/change-password (auth required) { currentPassword, newPassword }
app.put('/change-password', requireAdmin, async (c) => {
  try {
    const { currentPassword, newPassword } = await c.req.json();
    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Current and new password are required' }, 400);
    }
    if (newPassword.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400);

    const admin = await c.env.DB.prepare('SELECT * FROM admins WHERE id = ?1').bind(c.get('adminId')).first();
    if (!admin) return c.json({ error: 'Admin not found' }, 404);

    const match = await verifyPassword(currentPassword, admin.password_hash, admin.password_salt);
    if (!match) return c.json({ error: 'Current password is incorrect' }, 401);

    const { hash, salt } = await hashPassword(newPassword);
    await c.env.DB.prepare(
      "UPDATE admins SET password_hash = ?1, password_salt = ?2, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?3"
    )
      .bind(hash, salt, admin.id)
      .run();

    return c.json({ ok: true });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
