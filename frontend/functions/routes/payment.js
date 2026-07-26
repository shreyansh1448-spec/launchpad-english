import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { hmacSha256Hex, hexEquals } from '../lib/crypto.js';
import { createOrder as createRazorpayOrder } from '../lib/razorpay.js';
import { serializeOrder } from '../lib/serialize.js';

const app = new Hono();

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

// Escapes SQLite LIKE wildcards so user-supplied search text can't widen
// its own match with a stray % or _.
function escapeLike(term) {
  return term.replace(/[%_]/g, (ch) => `\\${ch}`);
}

// POST /api/payment/create-order
// body: { courseSlug, mode: 'online'|'offline', name, phone, email, address }
app.post('/create-order', async (c) => {
  try {
    const body = await c.req.json();
    const { courseSlug, mode, name, email, address } = body;
    const phone = normalizePhone(body.phone);

    if (!courseSlug || !mode || !name || !phone || !email || !address) {
      return c.json({ error: 'All fields are required' }, 400);
    }
    if (!['online', 'offline'].includes(mode)) {
      return c.json({ error: 'Invalid mode' }, 400);
    }

    const course = await c.env.DB.prepare('SELECT * FROM courses WHERE slug = ?1 AND active = 1').bind(courseSlug).first();
    if (!course) return c.json({ error: 'Course not found' }, 404);

    const amountRupees = mode === 'online' ? course.pricing_online_offer : course.pricing_offline_offer;
    const amountPaise = Math.round(amountRupees * 100);

    const rpOrder = await createRazorpayOrder(c.env, {
      amount: amountPaise,
      currency: 'INR',
      receipt: `lpe_${Date.now()}`,
      notes: { courseSlug, mode, name, phone },
    });

    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO orders (id, name, phone, phone_verified, email, address, course_slug, course_title, mode, amount, razorpay_order_id, status)
       VALUES (?1,?2,?3,0,?4,?5,?6,?7,?8,?9,?10,'created')`
    )
      .bind(id, name, phone, email, address, courseSlug, course.title, mode, amountPaise, rpOrder.id)
      .run();

    return c.json({
      orderId: id,
      razorpayOrderId: rpOrder.id,
      amount: amountPaise,
      currency: 'INR',
      keyId: c.env.RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXXXXXX',
      courseTitle: course.title,
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

    if (!hexEquals(expected, razorpay_signature || '')) {
      await c.env.DB.prepare("UPDATE orders SET status = 'failed', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?1")
        .bind(orderId)
        .run();
      return c.json({ error: 'Payment verification failed' }, 400);
    }

    await c.env.DB.prepare(
      "UPDATE orders SET status = 'paid', razorpay_payment_id = ?1, razorpay_signature = ?2, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?3"
    )
      .bind(razorpay_payment_id, razorpay_signature, orderId)
      .run();

    const updated = await c.env.DB.prepare('SELECT * FROM orders WHERE id = ?1').bind(orderId).first();
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

// GET /api/payment/admin/orders?search= (admin)
app.get('/admin/orders', requireAdmin, async (c) => {
  try {
    const search = (c.req.query('search') || '').trim();
    let query, values;
    if (search) {
      const pattern = `%${escapeLike(search)}%`;
      query =
        "SELECT * FROM orders WHERE phone LIKE ?1 ESCAPE '\\' OR email LIKE ?1 ESCAPE '\\' OR name LIKE ?1 ESCAPE '\\' OR course_title LIKE ?1 ESCAPE '\\' OR course_slug LIKE ?1 ESCAPE '\\' ORDER BY created_at DESC LIMIT 500";
      values = [pattern];
    } else {
      query = 'SELECT * FROM orders ORDER BY created_at DESC LIMIT 500';
      values = [];
    }
    const { results } = await c.env.DB.prepare(query).bind(...values).all();
    return c.json(results.map(serializeOrder));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/payment/admin/manual-order (admin) -> record a walk-in / cash payment.
app.post('/admin/manual-order', requireAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const { name, email, address, courseSlug, mode, amount, notes } = body;
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

    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO orders (id, name, phone, phone_verified, email, address, course_slug, course_title, mode, amount, currency, payment_method, status, notes)
       VALUES (?1,?2,?3,1,?4,?5,?6,?7,?8,?9,'INR','cash','paid',?10)`
    )
      .bind(id, name, phone, email, address || '', courseSlug, course.title, mode, Math.round(amountRupees * 100), notes || '')
      .run();

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
