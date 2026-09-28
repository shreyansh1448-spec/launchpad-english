// /sitemap.xml - generated from the database on every request, so new
// courses, blog posts and slug changes appear without a redeploy.
import { coursePath } from '../shared/course.js';

const STATIC_PATHS = ['/', '/about', '/online-courses', '/offline-courses', '/counselling', '/blog', '/faqs', '/contact', '/gallery'];

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function onRequestGet({ env, request }) {
  const { origin } = new URL(request.url);
  const [courses, posts] = await env.DB.batch([
    env.DB.prepare('SELECT slug, offer_online, offer_offline, updated_at FROM courses WHERE active = 1 ORDER BY display_order'),
    env.DB.prepare('SELECT slug, updated_at FROM blog_posts WHERE active = 1 ORDER BY published_at DESC'),
  ]);

  const urls = STATIC_PATHS.map((p) => ({ loc: `${origin}${p}` }));
  for (const c of courses.results) {
    for (const mode of ['online', 'offline']) {
      if (c[`offer_${mode}`]) urls.push({ loc: `${origin}${coursePath(mode, c.slug)}`, lastmod: c.updated_at });
    }
  }
  for (const p of posts.results) urls.push({ loc: `${origin}/blog/${p.slug}`, lastmod: p.updated_at });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${esc(u.lastmod.slice(0, 10))}</lastmod>` : ''}</url>`)
  .join('\n')}
</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } });
}
