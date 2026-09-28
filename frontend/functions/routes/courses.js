import { Hono } from 'hono';
import { requireAdmin } from '../lib/auth.js';
import { serializeCourse, serializeBatch, parseJson } from '../lib/serialize.js';

const app = new Hono();

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// camelCase body key -> [D1 column, kind]. Every course field the admin can
// edit goes through this map, for both create and update.
const FIELDS = {
  slug: ['slug', 'text'],
  title: ['title', 'text'],
  category: ['category', 'text'],
  tagline: ['tagline', 'text'],
  shortDescription: ['short_description', 'text'],
  fullDescription: ['full_description', 'text'],
  duration: ['duration', 'text'],
  level: ['level', 'text'],
  overview: ['overview', 'text'],
  highlights: ['highlights', 'json'],
  whoShouldJoin: ['who_should_join', 'json'],
  syllabus: ['syllabus', 'json'],
  dailyPattern: ['daily_pattern', 'json'],
  outcomes: ['outcomes', 'json'],
  faqs: ['faqs', 'json'],
  details: ['details', 'json'],
  images: ['images', 'json'],
  thumbnail: ['thumbnail', 'text'],
  heroImage: ['hero_image', 'text'],
  promoVideo: ['promo_video', 'text'],
  instructor: ['instructor', 'json'],
  modeContent: ['mode_content', 'json'],
  seo: ['seo', 'json'],
  currency: ['currency', 'text'],
  displayOrder: ['display_order', 'int'],
  active: ['active', 'bool'],
  featured: ['featured', 'bool'],
};

function toColumnValue(kind, value) {
  if (kind === 'json') return JSON.stringify(value ?? null);
  if (kind === 'bool') return value ? 1 : 0;
  if (kind === 'int') return Number.parseInt(value, 10) || 0;
  return value == null ? '' : String(value);
}

function money(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
}

// Body -> [[column, value], ...] for the fields present in the body.
function columnsFromBody(body) {
  const cols = [];
  for (const [key, [column, kind]] of Object.entries(FIELDS)) {
    if (body[key] !== undefined) cols.push([column, toColumnValue(kind, body[key])]);
  }
  if (body.modes) {
    if (body.modes.online !== undefined) cols.push(['offer_online', body.modes.online ? 1 : 0]);
    if (body.modes.offline !== undefined) cols.push(['offer_offline', body.modes.offline ? 1 : 0]);
  }
  for (const mode of ['online', 'offline']) {
    const p = body.pricing?.[mode];
    if (p) {
      cols.push([`pricing_${mode}_mrp`, money(p.mrp)]);
      cols.push([`pricing_${mode}_offer`, money(p.offer)]);
    }
  }
  return cols;
}

// Returns an error string, or '' if the merged course is valid. Drafts only
// need a title + slug; publishing needs enough to render a real page.
function validate(course) {
  if (!course.title?.trim()) return 'Course name is required';
  if (!SLUG_RE.test(course.slug || '')) return 'URL slug may only contain lowercase letters, numbers and hyphens';
  for (const mode of ['online', 'offline']) {
    const p = course.pricing?.[mode];
    if (p && Number(p.offer) > Number(p.mrp) && Number(p.mrp) > 0) {
      return `${mode === 'online' ? 'Online' : 'Offline'} sale price can't be higher than the original price`;
    }
  }
  if (course.seo?.customSchema) {
    try {
      JSON.parse(course.seo.customSchema);
    } catch {
      return 'Custom schema must be valid JSON';
    }
  }
  if (course.active) {
    if (!course.modes?.online && !course.modes?.offline) return 'Enable Online and/or Offline before publishing';
    if (!course.duration?.trim()) return 'Duration is required before publishing';
    for (const mode of ['online', 'offline']) {
      if (course.modes?.[mode] && !(Number(course.pricing?.[mode]?.offer) > 0)) {
        return `Set a ${mode} sale price before publishing`;
      }
    }
  }
  return '';
}

async function loadResources(db, courseId) {
  const { results } = await db
    .prepare('SELECT * FROM course_resources WHERE course_id = ?1 ORDER BY created_at')
    .bind(courseId)
    .all();
  return results;
}

async function loadBatches(db, courseId) {
  const { results } = await db
    .prepare(
      "SELECT * FROM batches WHERE (course_id = ?1 OR course_id IS NULL) AND status != 'closed' ORDER BY mode, display_order, time_label"
    )
    .bind(courseId)
    .all();
  return results.map(serializeBatch);
}

async function fullCourse(db, row) {
  return serializeCourse(row, await loadResources(db, row.id));
}

// Published course by slug, falling back to a legacy slug (renamed courses).
async function findPublished(db, slug) {
  const row = await db.prepare('SELECT * FROM courses WHERE slug = ?1 AND active = 1').bind(slug).first();
  if (row) return row;
  return db
    .prepare('SELECT c.* FROM courses c, json_each(c.legacy_slugs) j WHERE j.value = ?1 AND c.active = 1 LIMIT 1')
    .bind(slug)
    .first();
}

async function uniqueSlug(db, base) {
  let slug = base;
  for (let i = 2; await db.prepare('SELECT 1 FROM courses WHERE slug = ?1').bind(slug).first(); i++) {
    slug = `${base}-${i}`;
  }
  return slug;
}

// ------------------------------------------------------------------ public

// GET /api/courses?mode=online|offline -> published courses (optionally only
// those offered in that mode), sorted for display.
app.get('/', async (c) => {
  const mode = c.req.query('mode');
  let sql = 'SELECT * FROM courses WHERE active = 1';
  if (mode === 'online') sql += ' AND offer_online = 1';
  if (mode === 'offline') sql += ' AND offer_offline = 1';
  const { results } = await c.env.DB.prepare(`${sql} ORDER BY display_order, title`).all();
  return c.json(results.map((r) => serializeCourse(r, [], { full: false })));
});

// ------------------------------------------------------------------ admin

// GET /api/courses/admin/all -> every course incl. drafts (list view).
app.get('/admin/all', requireAdmin, async (c) => {
  const { results } = await c.env.DB.prepare('SELECT * FROM courses ORDER BY display_order, title').all();
  return c.json(results.map((r) => serializeCourse(r, [], { full: false })));
});

// GET /api/courses/admin/id/:id -> one course with everything, for the editor.
app.get('/admin/id/:id', requireAdmin, async (c) => {
  const row = await c.env.DB.prepare('SELECT * FROM courses WHERE id = ?1').bind(c.req.param('id')).first();
  if (!row) return c.json({ error: 'Course not found' }, 404);
  return c.json(await fullCourse(c.env.DB, row));
});

// POST /api/courses -> create a course.
app.post('/', requireAdmin, async (c) => {
  const body = await c.req.json();
  const draft = {
    modes: { online: true, offline: true },
    pricing: { online: { mrp: 0, offer: 0 }, offline: { mrp: 0, offer: 0 } },
    active: false,
    ...body,
  };
  const error = validate(draft);
  if (error) return c.json({ error }, 400);
  if (await c.env.DB.prepare('SELECT 1 FROM courses WHERE slug = ?1').bind(draft.slug).first()) {
    return c.json({ error: 'Another course already uses this URL slug' }, 400);
  }

  const id = crypto.randomUUID();
  // Columns without a DB default need a value even if the form left them out.
  const cols = new Map([
    ['tagline', ''],
    ['duration', ''],
    ['overview', ''],
    ['pricing_online_mrp', 0],
    ['pricing_online_offer', 0],
    ['pricing_offline_mrp', 0],
    ['pricing_offline_offer', 0],
  ]);
  for (const [col, val] of columnsFromBody(draft)) cols.set(col, val);
  cols.set('id', id);

  const names = [...cols.keys()];
  await c.env.DB.prepare(`INSERT INTO courses (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})`)
    .bind(...cols.values())
    .run();

  const row = await c.env.DB.prepare('SELECT * FROM courses WHERE id = ?1').bind(id).first();
  return c.json(await fullCourse(c.env.DB, row), 201);
});

// PUT /api/courses/admin/id/:id -> update any subset of fields.
app.put('/admin/id/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const existingRow = await db.prepare('SELECT * FROM courses WHERE id = ?1').bind(id).first();
  if (!existingRow) return c.json({ error: 'Course not found' }, 404);
  const existing = serializeCourse(existingRow);

  const body = await c.req.json();
  const merged = {
    ...existing,
    ...body,
    modes: { ...existing.modes, ...(body.modes || {}) },
    pricing: { ...existing.pricing, ...(body.pricing || {}) },
  };
  const error = validate(merged);
  if (error) return c.json({ error }, 400);

  const oldSlug = existingRow.slug;
  const newSlug = body.slug !== undefined ? body.slug : oldSlug;
  const slugChanged = newSlug !== oldSlug;
  if (slugChanged && (await db.prepare('SELECT 1 FROM courses WHERE slug = ?1 AND id != ?2').bind(newSlug, id).first())) {
    return c.json({ error: 'Another course already uses this URL slug' }, 400);
  }

  const cols = columnsFromBody(body);
  if (slugChanged) {
    // Old URL keeps working (301) and existing orders/reviews/gallery follow the rename.
    const legacy = new Set([...parseJson(existingRow.legacy_slugs, []), oldSlug]);
    legacy.delete(newSlug);
    cols.push(['legacy_slugs', JSON.stringify([...legacy])]);
  }

  const statements = [];
  if (cols.length) {
    statements.push(
      db
        .prepare(`UPDATE courses SET ${cols.map(([col]) => `${col} = ?`).join(', ')}, updated_at = ${NOW} WHERE id = ?`)
        .bind(...cols.map(([, v]) => v), id)
    );
  }
  if (slugChanged) {
    for (const table of ['orders', 'reviews', 'gallery']) {
      statements.push(db.prepare(`UPDATE ${table} SET course_slug = ?1 WHERE course_slug = ?2`).bind(newSlug, oldSlug));
    }
  }
  if (statements.length) await db.batch(statements);

  const row = await db.prepare('SELECT * FROM courses WHERE id = ?1').bind(id).first();
  return c.json(await fullCourse(db, row));
});

// POST /api/courses/admin/id/:id/duplicate -> copy as a new draft.
app.post('/admin/id/:id/duplicate', requireAdmin, async (c) => {
  const db = c.env.DB;
  const src = await db.prepare('SELECT * FROM courses WHERE id = ?1').bind(c.req.param('id')).first();
  if (!src) return c.json({ error: 'Course not found' }, 404);

  const id = crypto.randomUUID();
  const copy = { ...src, id, slug: await uniqueSlug(db, `${src.slug}-copy`), title: `${src.title} (Copy)`, active: 0, legacy_slugs: '[]' };
  delete copy.created_at;
  delete copy.updated_at;
  const names = Object.keys(copy);

  const statements = [
    db.prepare(`INSERT INTO courses (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})`).bind(...Object.values(copy)),
  ];
  const { results: batches } = await db.prepare('SELECT * FROM batches WHERE course_id = ?1').bind(src.id).all();
  for (const b of batches) {
    statements.push(
      db
        .prepare(
          `INSERT INTO batches (id, course_id, mode, day_type, time_label, classroom, seats_available, start_date, status, display_order)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`
        )
        .bind(crypto.randomUUID(), id, b.mode, b.day_type, b.time_label, b.classroom, b.seats_available, b.start_date, b.status, b.display_order)
    );
  }
  await db.batch(statements);

  const row = await db.prepare('SELECT * FROM courses WHERE id = ?1').bind(id).first();
  return c.json(serializeCourse(row, [], { full: false }), 201);
});

// DELETE /api/courses/admin/id/:id -> remove a course (and its own batches /
// PDFs). Past orders and reviews keep their stored course title/slug.
app.delete('/admin/id/:id', requireAdmin, async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const results = await db.batch([
    db.prepare('DELETE FROM batches WHERE course_id = ?1').bind(id),
    db.prepare('DELETE FROM course_resources WHERE course_id = ?1').bind(id),
    db.prepare('DELETE FROM courses WHERE id = ?1').bind(id),
  ]);
  if (results[2].meta.changes === 0) return c.json({ error: 'Course not found' }, 404);
  return c.json({ success: true });
});

// POST /api/courses/admin/id/:id/resources -> add one PDF resource.
// body: { title, dataUrl } - dataUrl is a base64 "data:application/pdf;..." string.
app.post('/admin/id/:id/resources', requireAdmin, async (c) => {
  const { title, dataUrl } = await c.req.json();
  if (!dataUrl) return c.json({ error: 'No PDF file uploaded' }, 400);
  if (!title) return c.json({ error: 'title is required' }, 400);
  if (!/^data:application\/pdf/.test(dataUrl)) return c.json({ error: 'Only PDF files are allowed' }, 400);

  const course = await c.env.DB.prepare('SELECT * FROM courses WHERE id = ?1').bind(c.req.param('id')).first();
  if (!course) return c.json({ error: 'Course not found' }, 404);

  await c.env.DB.prepare('INSERT INTO course_resources (id, course_id, title, url) VALUES (?1, ?2, ?3, ?4)')
    .bind(crypto.randomUUID(), course.id, title, dataUrl)
    .run();
  return c.json(await fullCourse(c.env.DB, course), 201);
});

// DELETE /api/courses/admin/id/:id/resources/:resourceId
app.delete('/admin/id/:id/resources/:resourceId', requireAdmin, async (c) => {
  const course = await c.env.DB.prepare('SELECT * FROM courses WHERE id = ?1').bind(c.req.param('id')).first();
  if (!course) return c.json({ error: 'Course not found' }, 404);
  const result = await c.env.DB.prepare('DELETE FROM course_resources WHERE id = ?1 AND course_id = ?2')
    .bind(c.req.param('resourceId'), course.id)
    .run();
  if (result.meta.changes === 0) return c.json({ error: 'Resource not found' }, 404);
  return c.json(await fullCourse(c.env.DB, course));
});

// ------------------------------------------------------------------ public detail

// GET /api/courses/:slug -> one published course (full content) plus its
// bookable batch timings. Old slugs resolve too; the response carries the
// current slug so the client can redirect.
app.get('/:slug', async (c) => {
  const row = await findPublished(c.env.DB, c.req.param('slug'));
  if (!row) return c.json({ error: 'Course not found' }, 404);
  const course = await fullCourse(c.env.DB, row);
  course.batches = await loadBatches(c.env.DB, row.id);
  return c.json(course);
});

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: err.message || 'Something went wrong' }, 500);
});

export { findPublished, loadBatches };
export default app;
