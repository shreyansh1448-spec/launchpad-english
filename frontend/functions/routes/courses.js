import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { serializeCourse } from '../lib/serialize.js';

const app = new Hono();

// camelCase body key -> [D1 column, isJson]
const FIELD_MAP = {
  slug: ['slug', false],
  title: ['title', false],
  tagline: ['tagline', false],
  duration: ['duration', false],
  level: ['level', false],
  overview: ['overview', false],
  highlights: ['highlights', true],
  whoShouldJoin: ['who_should_join', true],
  syllabus: ['syllabus', true],
  dailyPattern: ['daily_pattern', true],
  outcomes: ['outcomes', true],
  batchTimings: ['batch_timings', true],
  faqs: ['faqs', true],
  images: ['images', true],
  thumbnail: ['thumbnail', false],
  displayOrder: ['display_order', false],
  active: ['active', false],
  featured: ['featured', false],
};

async function attachResources(db, courses) {
  if (!courses.length) return courses;
  const placeholders = courses.map((_, i) => `?${i + 1}`).join(', ');
  const { results } = await db
    .prepare(`SELECT * FROM course_resources WHERE course_id IN (${placeholders}) ORDER BY created_at`)
    .bind(...courses.map((c) => c.id))
    .all();
  const byCourseId = new Map();
  for (const r of results) {
    if (!byCourseId.has(r.course_id)) byCourseId.set(r.course_id, []);
    byCourseId.get(r.course_id).push(r);
  }
  return courses.map((row) => serializeCourse(row, byCourseId.get(row.id) || []));
}

// GET /api/courses -> list of active courses, sorted for display
app.get('/', async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM courses WHERE active = 1 ORDER BY display_order').all();
    return c.json(await attachResources(c.env.DB, results));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/courses/admin/all -> admin only, every course incl. inactive ones
app.get('/admin/all', requireAdmin, async (c) => {
  try {
    const { results } = await c.env.DB.prepare('SELECT * FROM courses ORDER BY display_order').all();
    return c.json(await attachResources(c.env.DB, results));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/courses/:slug
app.get('/:slug', async (c) => {
  try {
    const row = await c.env.DB.prepare('SELECT * FROM courses WHERE slug = ?1 AND active = 1').bind(c.req.param('slug')).first();
    if (!row) return c.json({ error: 'Course not found' }, 404);
    const [course] = await attachResources(c.env.DB, [row]);
    return c.json(course);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/courses -> admin only, create a brand new course.
app.post('/', requireAdmin, async (c) => {
  try {
    const body = await c.req.json();
    if (!body.slug) return c.json({ error: 'slug is required' }, 400);
    if (!body.title || !body.tagline || !body.duration || !body.overview) {
      return c.json({ error: 'title, tagline, duration and overview are required' }, 400);
    }
    if (!body.pricing?.online || !body.pricing?.offline) {
      return c.json({ error: 'pricing.online and pricing.offline are required' }, 400);
    }

    const existing = await c.env.DB.prepare('SELECT id FROM courses WHERE slug = ?1').bind(body.slug).first();
    if (existing) return c.json({ error: 'A course with this slug already exists' }, 400);

    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO courses (
        id, slug, title, tagline, duration, level, overview,
        highlights, who_should_join, syllabus, daily_pattern, outcomes, batch_timings, faqs, images, thumbnail,
        pricing_online_mrp, pricing_online_offer, pricing_offline_mrp, pricing_offline_offer,
        display_order, active, featured
      ) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23)`
    )
      .bind(
        id,
        body.slug,
        body.title,
        body.tagline,
        body.duration,
        body.level || 'All Levels',
        body.overview,
        JSON.stringify(body.highlights || []),
        JSON.stringify(body.whoShouldJoin || []),
        JSON.stringify(body.syllabus || []),
        JSON.stringify(body.dailyPattern || []),
        JSON.stringify(body.outcomes || []),
        JSON.stringify(body.batchTimings || { online: [], offline: [] }),
        JSON.stringify(body.faqs || []),
        JSON.stringify(body.images || []),
        body.thumbnail || '',
        body.pricing.online.mrp,
        body.pricing.online.offer,
        body.pricing.offline.mrp,
        body.pricing.offline.offer,
        body.displayOrder || 0,
        body.active === undefined ? 1 : body.active ? 1 : 0,
        body.featured === undefined ? 1 : body.featured ? 1 : 0
      )
      .run();

    const row = await c.env.DB.prepare('SELECT * FROM courses WHERE id = ?1').bind(id).first();
    return c.json(serializeCourse(row, []), 201);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT /api/courses/:slug -> admin only. Send any subset of Course fields.
app.put('/:slug', requireAdmin, async (c) => {
  try {
    const slug = c.req.param('slug');
    const body = await c.req.json();

    const sets = [];
    const values = [];
    for (const [key, value] of Object.entries(body)) {
      if (key === 'pricing') continue; // handled separately below
      const mapping = FIELD_MAP[key];
      if (!mapping) continue;
      const [column, isJson] = mapping;
      sets.push(`${column} = ?`);
      values.push(isJson ? JSON.stringify(value) : key === 'active' || key === 'featured' ? (value ? 1 : 0) : value);
    }
    if (body.pricing?.online) {
      sets.push('pricing_online_mrp = ?', 'pricing_online_offer = ?');
      values.push(body.pricing.online.mrp, body.pricing.online.offer);
    }
    if (body.pricing?.offline) {
      sets.push('pricing_offline_mrp = ?', 'pricing_offline_offer = ?');
      values.push(body.pricing.offline.mrp, body.pricing.offline.offer);
    }

    if (sets.length) {
      values.push(slug);
      const result = await c.env.DB.prepare(
        `UPDATE courses SET ${sets.join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE slug = ?`
      )
        .bind(...values)
        .run();
      if (result.meta.changes === 0) return c.json({ error: 'Course not found' }, 404);
    }

    // Body may have changed the slug itself - look up by whichever slug now applies.
    const newSlug = body.slug || slug;
    const row = await c.env.DB.prepare('SELECT * FROM courses WHERE slug = ?1').bind(newSlug).first();
    if (!row) return c.json({ error: 'Course not found' }, 404);
    const [course] = await attachResources(c.env.DB, [row]);
    return c.json(course);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/courses/:slug/resources -> admin only, add one PDF resource.
// body: { title, dataUrl } - dataUrl is a base64 "data:application/pdf;..." string.
app.post('/:slug/resources', requireAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const { title, dataUrl } = body;
    if (!dataUrl) return c.json({ error: 'No PDF file uploaded' }, 400);
    if (!title) return c.json({ error: 'title is required' }, 400);
    if (!/^data:application\/pdf/.test(dataUrl)) return c.json({ error: 'Only PDF files are allowed' }, 400);

    const course = await c.env.DB.prepare('SELECT * FROM courses WHERE slug = ?1').bind(c.req.param('slug')).first();
    if (!course) return c.json({ error: 'Course not found' }, 404);

    const resourceId = crypto.randomUUID();
    await c.env.DB.prepare('INSERT INTO course_resources (id, course_id, title, url) VALUES (?1, ?2, ?3, ?4)')
      .bind(resourceId, course.id, title, dataUrl)
      .run();

    const [updated] = await attachResources(c.env.DB, [course]);
    return c.json(updated, 201);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// DELETE /api/courses/:slug/resources/:resourceId -> admin only.
app.delete('/:slug/resources/:resourceId', requireAdmin, async (c) => {
  try {
    const course = await c.env.DB.prepare('SELECT * FROM courses WHERE slug = ?1').bind(c.req.param('slug')).first();
    if (!course) return c.json({ error: 'Course not found' }, 404);

    const result = await c.env.DB.prepare('DELETE FROM course_resources WHERE id = ?1 AND course_id = ?2')
      .bind(c.req.param('resourceId'), course.id)
      .run();
    if (result.meta.changes === 0) return c.json({ error: 'Resource not found' }, 404);

    const [updated] = await attachResources(c.env.DB, [course]);
    return c.json(updated);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
