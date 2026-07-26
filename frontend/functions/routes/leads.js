import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { serializeLead } from '../lib/serialize.js';

const app = new Hono();

// POST /api/leads
// body: { type: 'contact'|'counselling', name, phone, email, courseType, message }
app.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const { type, name, phone } = body;
    if (!type || !name || !phone) {
      return c.json({ error: 'type, name and phone are required' }, 400);
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO contact_leads (id, type, name, phone, email, course_type, message)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
    )
      .bind(id, type, name, phone, body.email || '', body.courseType || '', body.message || '')
      .run();

    const row = await c.env.DB.prepare('SELECT * FROM contact_leads WHERE id = ?1').bind(id).first();
    return c.json({ success: true, lead: serializeLead(row) }, 201);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/leads (admin) -> all contact/counselling leads, newest first
app.get('/', requireAdmin, async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM contact_leads ORDER BY created_at DESC').all();
    return c.json(results.map(serializeLead));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
