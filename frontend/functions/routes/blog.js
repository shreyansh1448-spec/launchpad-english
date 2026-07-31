import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { serializeBlogPost } from '../lib/serialize.js';

const app = new Hono();

// camelCase body key -> D1 column
const FIELD_MAP = {
  slug: 'slug',
  title: 'title',
  excerpt: 'excerpt',
  content: 'content',
  thumbnail: 'thumbnail',
  publishedAt: 'published_at',
  active: 'active',
};

function toColumnValue(key, value) {
  if (key === 'active') return value ? 1 : 0;
  return value;
}

// GET /api/blog?page=&pageSize= -> published posts, newest first, paginated
app.get('/', async (c) => {
  try {
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
    const pageSize = Math.min(48, Math.max(1, parseInt(c.req.query('pageSize') || '12', 10)));
    const offset = (page - 1) * pageSize;

    const countRow = await c.env.DB.prepare('SELECT COUNT(*) as count FROM blog_posts WHERE active = 1').first();
    const { results } = await c.env.DB.prepare(
      'SELECT * FROM blog_posts WHERE active = 1 ORDER BY published_at DESC LIMIT ?1 OFFSET ?2'
    )
      .bind(pageSize, offset)
      .all();

    return c.json({ posts: results.map(serializeBlogPost), total: countRow.count, page, pageSize });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/blog/admin/all?page=&pageSize=&search= -> admin only, every post incl. inactive
app.get('/admin/all', requireAdmin, async (c) => {
  try {
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(c.req.query('pageSize') || '20', 10)));
    const offset = (page - 1) * pageSize;
    const search = (c.req.query('search') || '').trim();

    const where = search ? 'WHERE title LIKE ?1' : '';
    const bindArgs = search ? [`%${search}%`] : [];

    const countRow = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM blog_posts ${where}`)
      .bind(...bindArgs)
      .first();
    const { results } = await c.env.DB.prepare(
      `SELECT * FROM blog_posts ${where} ORDER BY published_at DESC LIMIT ?${bindArgs.length + 1} OFFSET ?${bindArgs.length + 2}`
    )
      .bind(...bindArgs, pageSize, offset)
      .all();

    return c.json({ posts: results.map(serializeBlogPost), total: countRow.count, page, pageSize });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/blog/:slug -> public single post
app.get('/:slug', async (c) => {
  try {
    const row = await c.env.DB.prepare('SELECT * FROM blog_posts WHERE slug = ?1 AND active = 1')
      .bind(c.req.param('slug'))
      .first();
    if (!row) return c.json({ error: 'Post not found' }, 404);
    return c.json(serializeBlogPost(row));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/blog (admin) -> create a new post
app.post('/', requireAdmin, async (c) => {
  try {
    const body = await c.req.json();
    if (!body.slug) return c.json({ error: 'slug is required' }, 400);
    if (!body.title) return c.json({ error: 'title is required' }, 400);

    const existing = await c.env.DB.prepare('SELECT id FROM blog_posts WHERE slug = ?1').bind(body.slug).first();
    if (existing) return c.json({ error: 'A post with this slug already exists' }, 400);

    const id = crypto.randomUUID();
    await c.env.DB.prepare(
      `INSERT INTO blog_posts (id, slug, title, excerpt, content, thumbnail, published_at, active)
       VALUES (?1,?2,?3,?4,?5,?6,?7,?8)`
    )
      .bind(
        id,
        body.slug,
        body.title,
        body.excerpt || '',
        body.content || '',
        body.thumbnail || '',
        body.publishedAt || new Date().toISOString(),
        body.active === undefined ? 1 : body.active ? 1 : 0
      )
      .run();

    const row = await c.env.DB.prepare('SELECT * FROM blog_posts WHERE id = ?1').bind(id).first();
    return c.json(serializeBlogPost(row), 201);
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT /api/blog/:slug (admin) -> partial update, send any subset of fields (slug itself may change)
app.put('/:slug', requireAdmin, async (c) => {
  try {
    const slug = c.req.param('slug');
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
      values.push(slug);
      const result = await c.env.DB.prepare(
        `UPDATE blog_posts SET ${sets.join(', ')}, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE slug = ?`
      )
        .bind(...values)
        .run();
      if (result.meta.changes === 0) return c.json({ error: 'Post not found' }, 404);
    }

    const newSlug = body.slug || slug;
    const row = await c.env.DB.prepare('SELECT * FROM blog_posts WHERE slug = ?1').bind(newSlug).first();
    if (!row) return c.json({ error: 'Post not found' }, 404);
    return c.json(serializeBlogPost(row));
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

// DELETE /api/blog/:slug (admin) -> permanently remove
app.delete('/:slug', requireAdmin, async (c) => {
  try {
    const result = await c.env.DB.prepare('DELETE FROM blog_posts WHERE slug = ?1').bind(c.req.param('slug')).run();
    if (result.meta.changes === 0) return c.json({ error: 'Post not found' }, 404);
    return c.json({ success: true });
  } catch (err) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
