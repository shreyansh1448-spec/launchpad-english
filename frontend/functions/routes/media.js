import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';

const app = new Hono();

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];
// D1 caps a row at ~2MB; the admin UI resizes images well below this first.
const MAX_BASE64_LENGTH = 1_900_000;

// POST /api/media (admin) body: { dataUrl, filename } -> { url }
app.post('/', requireAdmin, async (c) => {
  const { dataUrl, filename } = await c.req.json();
  const match = /^data:([\w/+.-]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return c.json({ error: 'Upload an image file' }, 400);
  const [, mime, data] = match;
  if (!ALLOWED.includes(mime)) return c.json({ error: 'Only JPG, PNG, WebP, GIF or AVIF images are allowed' }, 400);
  if (data.length > MAX_BASE64_LENGTH) return c.json({ error: 'Image is too large - please use one under 1.4MB' }, 400);

  const id = crypto.randomUUID();
  await c.env.DB.prepare('INSERT INTO media (id, filename, mime, size, data) VALUES (?1, ?2, ?3, ?4, ?5)')
    .bind(id, String(filename || '').slice(0, 200), mime, Math.floor((data.length * 3) / 4), data)
    .run();
  return c.json({ id, url: `/api/media/${id}` }, 201);
});

// GET /api/media/:id -> the raw image, cached forever (ids never change).
app.get('/:id', async (c) => {
  const row = await c.env.DB.prepare('SELECT mime, data FROM media WHERE id = ?1').bind(c.req.param('id')).first();
  if (!row) return c.json({ error: 'Not found' }, 404);
  const bytes = Uint8Array.from(atob(row.data), (ch) => ch.charCodeAt(0));
  return new Response(bytes, {
    headers: { 'Content-Type': row.mime, 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
});

export default app;
