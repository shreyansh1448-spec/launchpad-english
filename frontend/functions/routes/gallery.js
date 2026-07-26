import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { serializeGallery } from '../lib/serialize.js';

const app = new Hono();

// camelCase body key -> D1 column
const FIELD_MAP = {
  title: 'title',
  mediaType: 'media_type',
  imageUrl: 'image_url',
  videoUrl: 'video_url',
  category: 'category',
  courseSlug: 'course_slug',
  displayOrder: 'display_order',
  active: 'active',
};

function toColumnValue(key, value) {
  if (key === 'active') return value ? 1 : 0;
  return value;
}

// GET /api/gallery?category=classroom -> active photos, in display order
app.get('/', async (c) => {
  try {
    const category = c.req.query('category');
    const query = category
      ? c.env.DB.prepare('SELECT * FROM gallery WHERE active = 1 AND category = ?1 ORDER BY display_order').bind(
          category
        )
      : c.env.DB.prepare('SELECT * FROM gallery WHERE active = 1 ORDER BY display_order');
    const { results } = await query.all();
    return c.json(results.map(serializeGallery));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/gallery (admin)
// body: { title, mediaType, imageUrl, videoUrl, category, courseSlug, displayOrder }
app.post('/', requireAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const mediaType = body.mediaType || 'image';
    if (mediaType === 'video' && !body.videoUrl) {
      return c.json({ error: 'videoUrl is required when mediaType is video' }, 400);
    }
    if (mediaType !== 'video' && !body.imageUrl) {
      return c.json({ error: 'imageUrl is required when mediaType is not video' }, 400);
    }

    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO gallery (id, title, media_type, image_url, video_url, category, course_slug, display_order, active)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    )
      .bind(
        id,
        body.title || '',
        mediaType,
        body.imageUrl || '',
        body.videoUrl || '',
        body.category || 'classroom',
        body.courseSlug || '',
        body.displayOrder || 0,
        body.active === undefined ? 1 : body.active ? 1 : 0
      )
      .run();

    const row = await c.env.DB.prepare('SELECT * FROM gallery WHERE id = ?1').bind(id).first();
    return c.json(serializeGallery(row), 201);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT /api/gallery/:id (admin)
app.put('/:id', requireAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();

    const sets = [];
    const values = [];
    for (const [key, value] of Object.entries(body)) {
      const column = FIELD_MAP[key];
      if (!column) continue;
      sets.push(`${column} = ?`);
      values.push(toColumnValue(key, value));
    }

    if (sets.length) {
      values.push(id);
      await c.env.DB.prepare(`UPDATE gallery SET ${sets.join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`)
        .bind(...values)
        .run();
    }

    const row = await c.env.DB.prepare('SELECT * FROM gallery WHERE id = ?1').bind(id).first();
    return c.json(row ? serializeGallery(row) : null);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// DELETE /api/gallery/:id (admin) - soft delete
app.delete('/:id', requireAdmin, async (c) => {
  try {
    await c.env.DB.prepare("UPDATE gallery SET active = 0, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?1")
      .bind(c.req.param('id'))
      .run();
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
