import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { hmacSha256Hex, hexEquals } from '../lib/crypto.js';
import { createOrder as createRazorpayOrder } from '../lib/razorpay.js';
import { serializeOrder } from '../lib/serialize.js';
import { sendEmail } from '../lib/resend.js';

const app = new Hono();

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

// Escapes SQLite LIKE wildcards so user-supplied search text can't widen
// its own match with a stray % or _.
function escapeLike(term) {
  return term.replace(/[%_]/g, (ch) => `\\${ch}`);
}

const DAY_LABEL = { weekday: 'Weekday', weekend: 'Weekend', daily: 'Daily' };

function batchLabel(b) {
  return `${DAY_LABEL[b.day_type] || 'Weekday'} · ${b.time_label}${b.classroom ? ` · ${b.classroom}` : ''}`;
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]);
}

// Best-effort enrollment confirmation - a mail failure never fails the payment.
async function sendConfirmation(env, order) {
  if (!env.RESEND_API_KEY || !order.email) return false;
  const modeLabel = order.mode === 'online' ? 'Online' : 'Offline (Classroom)';
  const rows = [
    ['Course', order.course_title],
    ['Mode', modeLabel],
    ['Batch', order.batch_label || 'Our team will confirm your batch'],
    ['Amount paid', `₹${(order.amount / 100).toLocaleString('en-IN')}`],
    ['Payment ID', order.razorpay_payment_id || '-'],
    ['Order ID', order.razorpay_order_id || order.id],
  ];
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#111827">
      <h2 style="color:#1D4ED8">You're enrolled!</h2>
      <p>Hi ${escapeHtml(order.name)}, thank you for enrolling with Launch Pad English. Here are your details:</p>
      <table style="border-collapse:collapse;width:100%">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:8px;border:1px solid #E5E7EB;background:#F9FAFB;font-weight:600">${k}</td><td style="padding:8px;border:1px solid #E5E7EB">${escapeHtml(v)}</td></tr>`
          )
          .join('')}
      </table>
      <p>Our team will contact you on ${escapeHtml(order.phone)} with your class schedule and joining details.</p>
      <p>Questions? WhatsApp or call us on +91 98105 72736.</p>
      <p>- Team Launch Pad English</p>
    </div>`;
  try {
    await sendEmail(env, { to: order.email, subject: `Enrollment confirmed - ${order.course_title} (${modeLabel})`, html });
    return true;
  } catch (err) {
    console.error('Confirmation email failed', err);
    return false;
  }
}

const SEAT_TAKEN_SQL =
  "UPDATE batches SET seats_available = seats_available - 1, status = CASE WHEN seats_available - 1 <= 0 THEN 'full' ELSE status END WHERE id = ?1 AND seats_available > 0";

// POST /api/payment/create-order
// body: { courseSlug, mode: 'online'|'offline', batchId, name, phone, email, address }
// The amount is ALWAYS read from the database here - any price the browser
// might send is ignored.
app.post('/create-order', async (c) => {
  try {
    const body = await c.req.json();
    const { courseSlug, mode, batchId, name, email, address } = body;
    const phone = normalizePhone(body.phone);

    if (!courseSlug || !mode || !name || !phone || !email || !address) {
      return c.json({ error: 'All fields are required' }, 400);
    }
    if (!['online', 'offline'].includes(mode)) {
      return c.json({ error: 'Invalid mode' }, 400);
    }

    const course = await c.env.DB.prepare('SELECT * FROM courses WHERE slug = ?1 AND active = 1').bind(courseSlug).first();
    if (!course) return c.json({ error: 'Course not found' }, 404);
    if (!course[`offer_${mode}`]) return c.json({ error: `This course isn't available ${mode} right now` }, 400);

    // Batch must belong to this course (or be an all-course slot) in the same mode, and be bookable.
    const { results: batches } = await c.env.DB.prepare(
      "SELECT * FROM batches WHERE (course_id = ?1 OR course_id IS NULL) AND mode = ?2 AND status IN ('open', 'filling') AND (seats_available IS NULL OR seats_available > 0)"
    )
      .bind(course.id, mode)
      .all();
    let batch = null;
    if (batchId) {
      batch = batches.find((b) => b.id === batchId);
      if (!batch) return c.json({ error: 'That batch is no longer available - please pick another' }, 400);
    } else if (batches.length) {
      return c.json({ error: 'Please select a batch timing' }, 400);
    }

    const amountRupees = mode === 'online' ? course.pricing_online_offer : course.pricing_offline_offer;
    const amountPaise = Math.round(amountRupees * 100);
    if (!(amountPaise > 0)) return c.json({ error: 'This course is not open for online payment yet' }, 400);
    const currency = course.currency || 'INR';
    const label = batch ? batchLabel(batch) : '';

    const rpOrder = await createRazorpayOrder(c.env, {
      amount: amountPaise,
      currency,
      receipt: `lpe_${Date.now()}`,
      notes: { courseSlug, mode, name, phone, batch: label },
    });

    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO orders (id, name, phone, phone_verified, email, address, course_slug, course_title, mode, amount, currency, razorpay_order_id, status, batch_id, batch_label)
       VALUES (?1,?2,?3,0,?4,?5,?6,?7,?8,?9,?10,?11,'created',?12,?13)`
    )
      .bind(id, name, phone, email, address, course.slug, course.title, mode, amountPaise, currency, rpOrder.id, batch?.id || null, label)
      .run();

    return c.json({
      orderId: id,
      razorpayOrderId: rpOrder.id,
      amount: amountPaise,
      currency,
      keyId: c.env.RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXX',
      courseTitle: course.title,
      batchLabel: label,
      name,
      email,
      phone,
    });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/payment/verify
// body: { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature }
app.post('/verify', async (c) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await c.req.json();
    const secret = c.env.RAZORPAY_KEY_SECRET || 'REPLACE_WITH_TEST_SECRET';
    const expected = await hmacSha256Hex(secret, `${razorpay_order_id}|${razorpay_payment_id}`);

    const order = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?1').bind(orderId).first();
    if (!order) return c.json({ error: 'Order not found' }, 404);
    if (order.razorpay_order_id !== razorpay_order_id) return c.json({ error: 'Payment verification failed' }, 400);
    if (order.status === 'paid') return c.json({ success: true, order: serializeOrder(order) });

    if (!hexEquals(expected, razorpay_signature || '')) {
      await c.env.DB.prepare("UPDATE orders SET status = 'failed', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?1")
        .bind(orderId)
        .run();
      return c.json({ error: 'Payment verification failed' }, 400);
    }

    // Only the request that actually flips the order to paid takes a seat / sends mail.
    const flipped = await c.env.DB.prepare(
      "UPDATE orders SET status = 'paid', razorpay_payment_id = ?1, razorpay_signature = ?2, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?3 AND status != 'paid'"
    )
      .bind(razorpay_payment_id, razorpay_signature, orderId)
      .run();
    const firstVerify = flipped.meta.changes > 0;
    if (firstVerify && order.batch_id) {
      await c.env.DB.prepare(SEAT_TAKEN_SQL).bind(order.batch_id).run();
    }

    let updated = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?1').bind(orderId).first();
    if (firstVerify && (await sendConfirmation(c.env, updated))) {
      await c.env.DB.prepare('UPDATE orders SET confirmation_sent = 1 WHERE id = ?1').bind(orderId).run();
      updated = { ...updated, confirmation_sent: 1 };
    }
    return c.json({ success: true, order: serializeOrder(updated) });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/payment/my-orders?phone=&email= -> paid orders matching phone OR email.
app.get('/my-orders', async (c) => {
  try {
    const phone = normalizePhone(c.req.query('phone'));
    const email = (c.req.query('email') || '').trim().toLowerCase();
    if (!phone && !email) return c.json([]);

    const conditions = [];
    const values = [];
    if (phone) {
      conditions.push('phone = ?');
      values.push(phone);
    }
    if (email) {
      conditions.push('LOWER(email) = ?');
      values.push(email);
    }

    const { results } = await c.env.DB.prepare(
      `SELECT * FROM orders WHERE status = 'paid' AND (${conditions.join(' OR ')}) ORDER BY created_at DESC`
    )
      .bind(...values)
      .all();
    return c.json(results.map(serializeOrder));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/payment/admin/orders?search=&mode=&course=&status= (admin)
app.get('/admin/orders', requireAdmin, async (c) => {
  try {
    const search = (c.req.query('search') || '').trim();
    const mode = c.req.query('mode');
    const course = c.req.query('course');
    const status = c.req.query('status');
    const conditions = [];
    const values = [];
    if (search) {
      const cols = ['phone', 'email', 'name', 'course_title', 'razorpay_payment_id', 'razorpay_order_id'];
      conditions.push(`(${cols.map((col) => `${col} LIKE ? ESCAPE '\\'`).join(' OR ')})`);
      const pattern = `%${escapeLike(search)}%`;
      values.push(...cols.map(() => pattern));
    }
    if (['online', 'offline'].includes(mode)) {
      conditions.push('mode = ?');
      values.push(mode);
    }
    if (course) {
      conditions.push('course_slug = ?');
      values.push(course);
    }
    if (['created', 'paid', 'failed'].includes(status)) {
      conditions.push('status = ?');
      values.push(status);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { results } = await c.env.DB.prepare(`SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT 500`)
      .bind(...values)
      .all();
    return c.json(results.map(serializeOrder));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/payment/admin/manual-order (admin) -> record a walk-in / cash payment.
app.post('/admin/manual-order', requireAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, address, courseSlug, mode, amount, notes, batchId } = body;
    const phone = normalizePhone(body.phone);

    if (!name || !phone || !email || !courseSlug || !mode) {
      return c.json({ error: 'Name, phone, email, course and mode are required' }, 400);
    }
    if (!['online', 'offline'].includes(mode)) {
      return c.json({ error: 'Invalid mode' }, 400);
    }

    const course = await c.env.DB.prepare('SELECT * FROM courses WHERE slug = ?1').bind(courseSlug).first();
    if (!course) return c.json({ error: 'Course not found' }, 404);

    const defaultOffer = mode === 'online' ? course.pricing_online_offer : course.pricing_offline_offer;
    const amountRupees = amount !== undefined && amount !== null && amount !== '' ? Number(amount) : defaultOffer;
    if (!Number.isFinite(amountRupees) || amountRupees < 0) {
      return c.json({ error: 'Invalid amount' }, 400);
    }

    let batch = null;
    if (batchId) {
      batch = await c.env.DB.prepare('SELECT * FROM batches WHERE id = ?1 AND mode = ?2 AND (course_id = ?3 OR course_id IS NULL)')
        .bind(batchId, mode, course.id)
        .first();
      if (!batch) return c.json({ error: 'Batch not found for this course and mode' }, 400);
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO orders (id, name, phone, phone_verified, email, address, course_slug, course_title, mode, amount, currency, payment_method, status, notes, batch_id, batch_label)
       VALUES (?1,?2,?3,1,?4,?5,?6,?7,?8,?9,'INR','cash','paid',?10,?11,?12)`
    )
      .bind(id, name, phone, email, address || '', courseSlug, course.title, mode, Math.round(amountRupees * 100), notes || '', batch?.id || null, batch ? batchLabel(batch) : '')
      .run();
    if (batch) await c.env.DB.prepare(SEAT_TAKEN_SQL).bind(batch.id).run();

    const row = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?1').bind(id).first();
    return c.json(serializeOrder(row));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT /api/payment/admin/orders/:id/notes (admin)
app.put('/admin/orders/:id/notes', requireAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const id = c.req.param('id');
    const result = await c.env.DB.prepare(
      "UPDATE orders SET notes = ?1, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?2"
    )
      .bind(body.notes || '', id)
      .run();
    if (result.meta.changes === 0) return c.json({ error: 'Order not found' }, 404);
    const row = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?1').bind(id).first();
    return c.json(serializeOrder(row));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
