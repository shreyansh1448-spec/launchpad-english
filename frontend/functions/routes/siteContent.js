import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { serializeSiteContent } from '../lib/serialize.js';

const app = new Hono();

// Maps camelCase request-body keys to their D1 column, and whether the
// column stores JSON (needs JSON.stringify before writing).
const FIELD_MAP = {
  siteName: ['site_name', false],
  tagline: ['tagline', false],
  aboutTitle: ['about_title', false],
  aboutText: ['about_text', false],
  phone: ['phone', false],
  whatsapp: ['whatsapp', false],
  email: ['email', false],
  address: ['address', false],
  mapLat: ['map_lat', false],
  mapLng: ['map_lng', false],
  mapPlaceUrl: ['map_place_url', false],
  workingHours: ['working_hours', false],
  youtubeUrl: ['youtube_url', false],
  social: ['social', true],
  heroSlides: ['hero_slides', true],
  batchTimings: ['batch_timings', true],
  stats: ['stats', true],
};

async function getOrCreate(db) {
  let row = await db.prepare('SELECT * FROM site_content WHERE id = ?1').bind('1').first();
  if (!row) {
    await db.prepare('INSERT INTO site_content (id) VALUES (?1)').bind('1').run();
    row = await db.prepare('SELECT * FROM site_content WHERE id = ?1').bind('1').first();
  }
  return row;
}

// GET /api/site-content -> the singleton doc (auto-created with sensible
// defaults on first request).
app.get('/', async (c) => {
  try {
    const row = await getOrCreate(c.env.DB);
    return c.json(serializeSiteContent(row));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT /api/site-content (admin) - update any subset of fields.
app.put('/', requireAdmin, async (c) => {
  try {
    await getOrCreate(c.env.DB);
    const body = await c.req.json();

    const sets = [];
    const values = [];
    for (const [key, value] of Object.entries(body)) {
      const mapping = FIELD_MAP[key];
      if (!mapping) continue;
      const [column, isJson] = mapping;
      sets.push(`${column} = ?`);
      values.push(isJson ? JSON.stringify(value) : value);
    }

    if (sets.length) {
      values.push('1');
      await c.env.DB.prepare(`UPDATE site_content SET ${sets.join(', ')} WHERE id = ?`)
        .bind(...values)
        .run();
    }

    const row = await c.env.DB.prepare('SELECT * FROM site_content WHERE id = ?1').bind('1').first();
    return c.json(serializeSiteContent(row));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
