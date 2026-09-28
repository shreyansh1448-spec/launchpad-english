// Server-side SEO for the course pages. The site is a React SPA, so without
// this every URL would ship the same generic <title>. These handlers take the
// built index.html and, per request, inject the course's own title, meta
// description, canonical, Open Graph tags and JSON-LD (Course / FAQPage /
// BreadcrumbList) from D1, plus a plain-HTML version of the page content in
// #root that crawlers can read before JS runs (React replaces it on boot).
import { serializeCourse } from './serialize.js';
import { findPublished } from '../routes/courses.js';
import {
  MODE_META,
  coursePath,
  courseSeo,
  courseJsonLd,
  courseH1,
  listingSeo,
  listingJsonLd,
  modeCopy,
  priceFor,
  formatPrice,
  shortTitle,
  breadcrumbsFor,
} from '../../shared/course.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (ch) => ESC[ch]);
}

// JSON-LD inside <script>: only "</" needs neutralising.
function ldScript(data) {
  return `<script type="application/ld+json" data-seo="1">${JSON.stringify(data).replace(/<\//g, '<\\/')}</script>`;
}

function headTags(seo, jsonLd = [], { noindex = false } = {}) {
  const tags = [
    `<link rel="canonical" href="${esc(seo.canonical)}" data-seo="1">`,
    `<meta property="og:type" content="${esc(seo.ogType || 'website')}" data-seo="1">`,
    `<meta property="og:site_name" content="Launch Pad English" data-seo="1">`,
    `<meta property="og:title" content="${esc(seo.ogTitle)}" data-seo="1">`,
    `<meta property="og:description" content="${esc(seo.ogDescription)}" data-seo="1">`,
    `<meta property="og:url" content="${esc(seo.canonical)}" data-seo="1">`,
    `<meta name="twitter:card" content="summary_large_image" data-seo="1">`,
    `<meta name="twitter:title" content="${esc(seo.ogTitle)}" data-seo="1">`,
    `<meta name="twitter:description" content="${esc(seo.ogDescription)}" data-seo="1">`,
  ];
  if (seo.ogImage) {
    tags.push(`<meta property="og:image" content="${esc(seo.ogImage)}" data-seo="1">`);
    tags.push(`<meta name="twitter:image" content="${esc(seo.ogImage)}" data-seo="1">`);
  }
  if (seo.keywords) tags.push(`<meta name="keywords" content="${esc(seo.keywords)}" data-seo="1">`);
  if (noindex) tags.push('<meta name="robots" content="noindex" data-seo="1">');
  for (const block of jsonLd) tags.push(ldScript(block));
  return tags.join('\n    ');
}

async function renderShell(ctx, { seo, jsonLd, bodyHtml, status = 200, noindex = false }) {
  const shell = await ctx.env.ASSETS.fetch(new URL('/', ctx.request.url));
  const transformed = new HTMLRewriter()
    .on('title', { element: (el) => el.setInnerContent(seo.title) })
    .on('meta[name="description"]', { element: (el) => el.setAttribute('content', seo.description) })
    .on('head', { element: (el) => el.append(headTags(seo, jsonLd, { noindex }), { html: true }) })
    .on('div#root', { element: (el) => el.setInnerContent(bodyHtml || '', { html: true }) })
    .transform(shell);
  return new Response(transformed.body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, must-revalidate' },
  });
}

function breadcrumbHtml(crumbs) {
  return `<nav class="breadcrumbs" aria-label="Breadcrumb">${crumbs
    .map((c, i) => (i === crumbs.length - 1 ? `<span>${esc(c.name)}</span>` : `<a href="${esc(c.path)}">${esc(c.name)}</a> › `))
    .join('')}</nav>`;
}

function list(items) {
  const clean = (items || []).filter(Boolean);
  return clean.length ? `<ul>${clean.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '';
}

async function publishedCourses(db, mode) {
  const { results } = await db
    .prepare(`SELECT * FROM courses WHERE active = 1 AND offer_${mode} = 1 ORDER BY display_order, title`)
    .all();
  return results.map((r) => serializeCourse(r, [], { full: false }));
}

export async function renderCoursePage(ctx, mode) {
  const { env, request, params } = ctx;
  const origin = new URL(request.url).origin;
  const slug = String(params.slug || '').toLowerCase();
  const row = await findPublished(env.DB, slug);

  if (row && row.slug !== slug && row[`offer_${mode}`]) {
    return Response.redirect(`${origin}${coursePath(mode, row.slug)}`, 301);
  }
  if (!row || !row[`offer_${mode}`]) {
    const seo = { ...listingSeo(mode, origin), title: 'Course not found | Launch Pad English' };
    return renderShell(ctx, { seo, jsonLd: [], status: 404, noindex: true });
  }

  const course = serializeCourse(row);
  const seo = courseSeo(course, mode, origin);
  const { headline, intro } = modeCopy(course, mode);
  const price = priceFor(course, mode);
  const related = (await publishedCourses(env.DB, mode)).filter((c) => c.slug !== course.slug);

  const body = `
<div class="container section seo-prerender">
  ${breadcrumbHtml(breadcrumbsFor(mode, course))}
  <h1>${esc(courseH1(course, mode))}</h1>
  <p><strong>${esc(headline)}</strong></p>
  <p>${esc(intro)}</p>
  <p>${esc(MODE_META[mode].badge)} · ${esc(course.duration)} · ${esc(course.level)}${course.category ? ` · ${esc(course.category)}` : ''}</p>
  <p>Fee: ${price.mrp > price.offer ? `<s>${esc(formatPrice(price.mrp, course.currency))}</s> ` : ''}<strong>${esc(formatPrice(price.offer, course.currency))}</strong>${price.discount ? ` (${price.discount}% off)` : ''}</p>
  ${course.fullDescription || `<p>${esc(course.overview)}</p>`}
  ${course.outcomes.length ? `<h2>What you will learn</h2>${list(course.outcomes)}` : ''}
  ${course.highlights.length ? `<h2>Course features</h2>${list(course.highlights)}` : ''}
  ${
    course.syllabus.length
      ? `<h2>Curriculum</h2>${course.syllabus.map((m) => `<h3>${esc(m.module)}</h3>${list(m.points)}`).join('')}`
      : ''
  }
  ${
    course.faqs.length
      ? `<h2>Frequently asked questions</h2>${course.faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('')}`
      : ''
  }
  ${
    related.length
      ? `<h2>More ${esc(MODE_META[mode].listingTitle.toLowerCase())}</h2><ul>${related
          .map((c) => `<li><a href="${coursePath(mode, c.slug)}">${esc(shortTitle(c.title))} — ${esc(MODE_META[mode].label)}</a></li>`)
          .join('')}</ul>`
      : ''
  }
</div>`;

  return renderShell(ctx, { seo, jsonLd: courseJsonLd(course, mode, origin), bodyHtml: body });
}

export async function renderListingPage(ctx, mode) {
  const origin = new URL(ctx.request.url).origin;
  const courses = await publishedCourses(ctx.env.DB, mode);
  const seo = listingSeo(mode, origin);
  const body = `
<div class="container section seo-prerender">
  ${breadcrumbHtml(breadcrumbsFor(mode))}
  <h1>${esc(MODE_META[mode].listingTitle)}</h1>
  <p>${esc(MODE_META[mode].listingIntro)}</p>
  <ul>${courses
    .map((c) => {
      const p = priceFor(c, mode);
      return `<li><a href="${coursePath(mode, c.slug)}">${esc(courseH1(c, mode))}</a> - ${esc(c.shortDescription)} (${esc(formatPrice(p.offer, c.currency))})</li>`;
    })
    .join('')}</ul>
</div>`;
  return renderShell(ctx, { seo, jsonLd: listingJsonLd(mode, courses, origin), bodyHtml: body });
}
