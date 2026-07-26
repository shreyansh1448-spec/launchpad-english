import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { serializeReview } from '../lib/serialize.js';

const app = new Hono();

// GET /api/reviews?courseSlug=xxx -> list reviews (all courses if omitted)
app.get('/', async (c) => {
  try {
    const courseSlug = c.req.query('courseSlug');
    const query = courseSlug
      ? c.env.DB.prepare(
          'SELECT * FROM reviews WHERE approved = 1 AND course_slug = ?1 ORDER BY featured DESC, created_at DESC'
        ).bind(courseSlug)
      : c.env.DB.prepare('SELECT * FROM reviews WHERE approved = 1 ORDER BY featured DESC, created_at DESC');
    const { results } = await query.all();
    return c.json(results.map(serializeReview));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/reviews/admin/all -> admin only, every review incl. unapproved
app.get('/admin/all', requireAdmin, async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
    return c.json(results.map(serializeReview));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/reviews/admin (admin) - add a review directly, no purchase required.
app.post('/admin', requireAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const { courseSlug, name, role, stars, text, photoUrl, approved, featured, reviewDate } = body;
    if (!courseSlug || !name || !stars) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    const starsNum = Number(stars);
    if (starsNum < 1 || starsNum > 5) {
      return c.json({ error: 'Stars must be between 1 and 5' }, 400);
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO reviews (id, order_id, source, course_slug, name, role, stars, text, photo_url, review_date, approved, featured)
       VALUES (?1, NULL, 'admin', ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
    )
      .bind(
        id,
        courseSlug,
        name,
        role || '',
        starsNum,
        text || '',
        photoUrl || '',
        reviewDate || null,
        approved === undefined ? 1 : approved ? 1 : 0,
        featured ? 1 : 0
      )
      .run();

    const row = await c.env.DB.prepare('SELECT * FROM reviews WHERE id = ?1').bind(id).first();
    return c.json(serializeReview(row), 201);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT /api/reviews/:id (admin) - approve/hide (reject), edit, and feature.
app.put('/:id', requireAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const id = c.req.param('id');

    const sets = [];
    const values = [];
    if ('approved' in body) {
      sets.push('approved = ?');
      values.push(body.approved ? 1 : 0);
    }
    if ('featured' in body) {
      sets.push('featured = ?');
      values.push(body.featured ? 1 : 0);
    }
    if ('name' in body) {
      sets.push('name = ?');
      values.push(body.name);
    }
    if ('role' in body) {
      sets.push('role = ?');
      values.push(body.role);
    }
    if ('text' in body) {
      sets.push('text = ?');
      values.push(body.text);
    }
    if ('reviewDate' in body) {
      sets.push('review_date = ?');
      values.push(body.reviewDate || null);
    }
    if ('photoUrl' in body) {
      sets.push('photo_url = ?');
      values.push(body.photoUrl || '');
    }
    if ('stars' in body) {
      const stars = Number(body.stars);
      if (stars < 1 || stars > 5) return c.json({ error: 'Stars must be between 1 and 5' }, 400);
      sets.push('stars = ?');
      values.push(stars);
    }

    if (!sets.length) {
      const row = await c.env.DB.prepare('SELECT * FROM reviews WHERE id = ?1').bind(id).first();
      if (!row) return c.json({ error: 'Review not found' }, 404);
      return c.json(serializeReview(row));
    }

    values.push(id);
    const result = await c.env.DB.prepare(
      `UPDATE reviews SET ${sets.join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`
    )
      .bind(...values)
      .run();
    if (result.meta.changes === 0) return c.json({ error: 'Review not found' }, 404);

    const row = await c.env.DB.prepare('SELECT * FROM reviews WHERE id = ?1').bind(id).first();
    return c.json(serializeReview(row));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// DELETE /api/reviews/:id (admin)
app.delete('/:id', requireAdmin, async (c) => {
  try {
    await c.env.DB.prepare('DELETE FROM reviews WHERE id = ?1').bind(c.req.param('id')).run();
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/reviews
// body: { orderId, courseSlug, name, role, stars, text, photoUrl }
// Only accepted if orderId references a *paid* Order for that courseSlug.
// One review per order: upserts on order_id via ON CONFLICT, backed by the
// unique index on reviews.order_id.
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { orderId, courseSlug, name, role, stars, text, photoUrl } = body;
    if (!orderId || !courseSlug || !name || !stars || !text) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    if (stars < 1 || stars > 5) {
      return c.json({ error: 'Stars must be between 1 and 5' }, 400);
    }

    const order = await c.env.DB.prepare("SELECT * FROM orders WHERE id = ?1 AND course_slug = ?2 AND status = 'paid'")
      .bind(orderId, courseSlug)
      .first();
    if (!order) {
      return c.json({ error: 'Only verified purchasers of this course can post a review' }, 403);
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO reviews (id, order_id, source, course_slug, name, role, stars, text, photo_url)
       VALUES (?1, ?2, 'purchase', ?3, ?4, ?5, ?6, ?7, ?8)
       ON CONFLICT(order_id) DO UPDATE SET
         source = 'purchase', course_slug = excluded.course_slug, name = excluded.name,
         role = excluded.role, stars = excluded.stars, text = excluded.text, photo_url = excluded.photo_url,
         updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`
    )
      .bind(id, order.id, courseSlug, name, role || '', stars, text, photoUrl || '')
      .run();

    const row = await c.env.DB.prepare('SELECT * FROM reviews WHERE order_id = ?1').bind(order.id).first();
    return c.json(serializeReview(row), 201);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/reviews/by-order/:orderId
app.get('/by-order/:orderId', async (c) => {
  try {
    const orderId = c.req.param('orderId');
    const order = await c.env.DB.prepare("SELECT * FROM orders WHERE id = ?1 AND status = 'paid'").bind(orderId).first();
    if (!order) return c.json({ error: 'Order not found' }, 403);
    const review = await c.env.DB.prepare('SELECT * FROM reviews WHERE order_id = ?1').bind(order.id).first();
    return c.json(review ? serializeReview(review) : null);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT /api/reviews/by-order/:orderId
app.put('/by-order/:orderId', async (c) => {
  try {
    const body = await c.req.json();
    const { courseSlug, name, role, stars, text, photoUrl } = body;
    if (!courseSlug || !name || !stars || !text) {
      return c.json({ error: 'Missing required fields' }, 400);
    }
    if (stars < 1 || stars > 5) {
      return c.json({ error: 'Stars must be between 1 and 5' }, 400);
    }

    const orderId = c.req.param('orderId');
    const order = await c.env.DB.prepare("SELECT * FROM orders WHERE id = ?1 AND course_slug = ?2 AND status = 'paid'")
      .bind(orderId, courseSlug)
      .first();
    if (!order) {
      return c.json({ error: 'Only verified purchasers of this course can edit this review' }, 403);
    }

    const result = await c.env.DB.prepare(
      `UPDATE reviews SET name = ?1, role = ?2, stars = ?3, text = ?4, photo_url = ?5, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE order_id = ?6`
    )
      .bind(name, role || '', stars, text, photoUrl || '', order.id)
      .run();
    if (result.meta.changes === 0) return c.json({ error: 'No existing review to edit' }, 404);

    const row = await c.env.DB.prepare('SELECT * FROM reviews WHERE order_id = ?1').bind(order.id).first();
    return c.json(serializeReview(row));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
