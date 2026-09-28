import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { serializeBatch } from '../lib/serialize.js';

const app = new Hono();

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";
const MODES = ['online', 'offline'];
const DAY_TYPES = ['weekday', 'weekend', 'daily'];
const STATUSES = ['open', 'filling', 'full', 'closed'];

// Validates + normalises a batch body. Returns { error } or { values }.
function normalise(body, existing = {}) {
  const b = { ...existing, ...body };
  if (!MODES.includes(b.mode)) return { error: 'Mode must be online or offline' };
  if (!DAY_TYPES.includes(b.dayType || 'weekday')) return { error: 'Invalid day type' };
  if (!STATUSES.includes(b.status || 'open')) return { error: 'Invalid status' };
  if (!String(b.timeLabel || '').trim()) return { error: 'Batch time is required' };
  const seats = b.seatsAvailable === '' || b.seatsAvailable === null || b.seatsAvailable === undefined ? null : Number(b.seatsAvailable);
  if (seats !== null && (!Number.isInteger(seats) || seats < 0)) return { error: 'Seats must be a whole number' };
  return {
    values: {
      course_id: b.courseId || null,
      mode: b.mode,
      day_type: b.dayType || 'weekday',
      time_label: String(b.timeLabel).trim(),
      classroom: b.mode === 'offline' ? String(b.classroom || '').trim() : '',
      seats_available: seats,
      start_date: String(b.startDate || '').trim(),
      status: b.status || 'open',
      display_order: Number.parseInt(b.displayOrder, 10) || 0,
    },
  };
}

// GET /api/batches?mode=online -> bookable, all-course batch slots (Home page).
app.get('/', async (c) => {
  const mode = c.req.query('mode');
  let sql = "SELECT * FROM batches WHERE course_id IS NULL AND status != 'closed'";
  const values = [];
  if (MODES.includes(mode)) {
    sql += ' AND mode = ?1';
    values.push(mode);
  }
  const { results } = await c.env.DB.prepare(`${sql} ORDER BY mode, day_type, display_order, time_label`).bind(...values).all();
  return c.json(results.map(serializeBatch));
});

// GET /api/batches/admin/all?courseId= (admin) -> every batch, incl. closed.
app.get('/admin/all', requireAdmin, async (c) => {
  const courseId = c.req.query('courseId');
  const query = courseId
    ? c.env.DB.prepare('SELECT * FROM batches WHERE course_id = ?1 ORDER BY mode, display_order, time_label').bind(courseId)
    : c.env.DB.prepare('SELECT * FROM batches ORDER BY mode, course_id IS NOT NULL, display_order, time_label');
  const { results } = await query.all();
  return c.json(results.map(serializeBatch));
});

// POST /api/batches (admin)
app.post('/', requireAdmin, async (c) => {
  const { error, values } = normalise(await c.req.json());
  if (error) return c.json({ error }, 400);
  if (values.course_id && !(await c.env.DB.prepare('SELECT 1 FROM courses WHERE id = ?1').bind(values.course_id).first())) {
    return c.json({ error: 'Course not found' }, 400);
  }
  const id = crypto.randomUUID();
  const names = Object.keys(values);
  await c.env.DB.prepare(`INSERT INTO batches (id, ${names.join(', ')}) VALUES (?, ${names.map(() => '?').join(', ')})`)
    .bind(id, ...Object.values(values))
    .run();
  const row = await c.env.DB.prepare('SELECT * FROM batches WHERE id = ?1').bind(id).first();
  return c.json(serializeBatch(row), 201);
});

// PUT /api/batches/:id (admin)
app.put('/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare('SELECT * FROM batches WHERE id = ?1').bind(id).first();
  if (!row) return c.json({ error: 'Batch not found' }, 404);
  const { error, values } = normalise(await c.req.json(), serializeBatch(row));
  if (error) return c.json({ error }, 400);
  const names = Object.keys(values);
  await c.env.DB.prepare(`UPDATE batches SET ${names.map((n) => `${n} = ?`).join(', ')}, updated_at = ${NOW} WHERE id = ?`)
    .bind(...Object.values(values), id)
    .run();
  const updated = await c.env.DB.prepare('SELECT * FROM batches WHERE id = ?1').bind(id).first();
  return c.json(serializeBatch(updated));
});

// DELETE /api/batches/:id (admin)
app.delete('/:id', requireAdmin, async (c) => {
  const result = await c.env.DB.prepare('DELETE FROM batches WHERE id = ?1').bind(c.req.param('id')).run();
  if (result.meta.changes === 0) return c.json({ error: 'Batch not found' }, 404);
  return c.json({ success: true });
});

export default app;
