// Course helpers shared by the React app (src/) and the Pages Functions
// (functions/) - URLs, pricing, and SEO/structured data are derived from the
// course record in exactly one place, so the listing cards, detail page,
// server-rendered meta tags, sitemap and checkout can never disagree.

export const MODES = ['online', 'offline'];

export const SITE_NAME = 'Launch Pad English';

export const MODE_META = {
  online: {
    label: 'Online',
    listingTitle: 'Online Courses',
    listingPath: '/online-courses',
    badge: 'Live Online',
    icon: 'fa-laptop',
    schemaMode: 'online',
    listingIntro:
      'Live, trainer-led online classes - build your English skills from anywhere with a stable internet connection.',
  },
  offline: {
    label: 'Offline',
    listingTitle: 'Offline Courses',
    listingPath: '/offline-courses',
    badge: 'Classroom',
    icon: 'fa-chalkboard-user',
    schemaMode: 'onsite',
    listingIntro:
      'Classroom programs at our South Delhi campus (Green Park) - hands-on speaking practice, group activities and in-person mentoring.',
  },
};

export function isMode(mode) {
  return mode === 'online' || mode === 'offline';
}

export function coursePath(mode, slug) {
  return `${MODE_META[mode].listingPath}/${slug}`;
}

export function offersMode(course, mode) {
  return !!course?.modes?.[mode];
}

export function courseModes(course) {
  return MODES.filter((m) => offersMode(course, m));
}

export function discountPct(mrp, offer) {
  const m = Number(mrp) || 0;
  const o = Number(offer) || 0;
  return m > o && m > 0 ? Math.round(((m - o) / m) * 100) : 0;
}

// { mrp, offer, discount } for one mode, straight from the DB pricing.
export function priceFor(course, mode) {
  const p = course?.pricing?.[mode] || {};
  const mrp = Number(p.mrp) || 0;
  const offer = Number(p.offer) || 0;
  return { mrp, offer, discount: discountPct(mrp, offer) };
}

export function formatPrice(amount, currency = 'INR') {
  const n = Number(amount) || 0;
  if (currency === 'INR') return `₹${n.toLocaleString('en-IN')}`;
  return `${currency} ${n.toLocaleString('en-IN')}`;
}

// "IELTS Preparation Course" -> "IELTS Preparation" (nav menus, breadcrumbs).
export function shortTitle(title = '') {
  return title.replace(/\s+(Course|Program)(\s*\(.*\))?$/i, '').trim() || title;
}

export function stripHtml(html = '') {
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text, max) {
  if (!text || text.length <= max) return text || '';
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 40 ? cut.lastIndexOf(' ') : cut.length)}…`;
}

function absoluteUrl(origin, url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('data:')) return '';
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

// Mode-specific hero copy: the admin can write a separate headline/intro for
// the online and offline pages (unique content per URL); falls back to the
// course-wide tagline/short description.
export function modeCopy(course, mode) {
  const mc = course?.modeContent?.[mode] || {};
  return {
    headline: mc.headline || course?.tagline || '',
    intro: mc.intro || course?.shortDescription || '',
  };
}

export function courseH1(course, mode) {
  return `${course.title} — ${MODE_META[mode].label}`;
}

// Title/description/canonical/OG for a course detail page. Admin-entered SEO
// fields win; everything else is generated from the course content.
export function courseSeo(course, mode, origin) {
  const s = course?.seo?.[mode] || {};
  const { headline, intro } = modeCopy(course, mode);
  const modeWord = mode === 'online' ? 'Live Online Classes' : 'Classroom Classes in South Delhi';
  const title = s.title || `${course.title} — ${MODE_META[mode].label} | ${SITE_NAME}`;
  const lead = (intro || headline || course.title).trim().replace(/[.!?]*$/, '.');
  const description =
    s.description || truncate(`${lead} ${modeWord}${course.duration ? `, ${course.duration}` : ''}.`, 158);
  const canonical = s.canonical || `${origin}${coursePath(mode, course.slug)}`;
  const image = absoluteUrl(origin, s.ogImage || course.heroImage || course.thumbnail || '/images/logo.png');
  return {
    title,
    description,
    canonical,
    keywords: s.focusKeyword || '',
    ogTitle: s.ogTitle || title,
    ogDescription: s.ogDescription || description,
    ogImage: image,
    ogType: 'website',
  };
}

export function listingSeo(mode, origin) {
  const meta = MODE_META[mode];
  return {
    title: `${meta.listingTitle} - Spoken English, IELTS & PTE | ${SITE_NAME}`,
    description: truncate(meta.listingIntro, 158),
    canonical: `${origin}${meta.listingPath}`,
    ogTitle: `${meta.listingTitle} | ${SITE_NAME}`,
    ogDescription: truncate(meta.listingIntro, 158),
    ogImage: `${origin}/images/logo.png`,
    ogType: 'website',
  };
}

export function breadcrumbsFor(mode, course) {
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: MODE_META[mode].listingTitle, path: MODE_META[mode].listingPath },
  ];
  if (course) crumbs.push({ name: shortTitle(course.title), path: coursePath(mode, course.slug) });
  return crumbs;
}

function breadcrumbLd(crumbs, origin) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: `${origin}${c.path}`,
    })),
  };
}

// Course + BreadcrumbList + FAQPage JSON-LD for one course/mode page, all
// generated from the DB record (plus any custom schema the admin added).
export function courseJsonLd(course, mode, origin) {
  const seo = courseSeo(course, mode, origin);
  const price = priceFor(course, mode);
  const currency = course.currency || 'INR';
  const provider = { '@type': 'Organization', name: SITE_NAME, sameAs: origin };
  const courseLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: courseH1(course, mode),
    description: seo.description,
    url: seo.canonical,
    image: seo.ogImage || undefined,
    provider,
    inLanguage: 'en',
    educationalLevel: course.level || undefined,
    about: course.category || undefined,
    offers: {
      '@type': 'Offer',
      category: 'Paid',
      price: price.offer,
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      url: seo.canonical,
    },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: MODE_META[mode].schemaMode,
      ...(course.duration ? { courseWorkload: course.duration } : {}),
      ...(mode === 'offline'
        ? {
            location: {
              '@type': 'Place',
              name: `${SITE_NAME} - Green Park, South Delhi`,
              address: 'Thapar House, Gautam Nagar, Green Park, New Delhi 110049',
            },
          }
        : {}),
    },
    ...(course.syllabus?.length
      ? { syllabusSections: course.syllabus.map((m) => ({ '@type': 'Syllabus', name: m.module, description: (m.points || []).join(', ') })) }
      : {}),
  };
  const out = [courseLd, breadcrumbLd(breadcrumbsFor(mode, course), origin)];
  const faqs = (course.faqs || []).filter((f) => f.q && f.a);
  if (faqs.length) {
    out.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: stripHtml(f.a) },
      })),
    });
  }
  const custom = course.seo?.customSchema;
  if (custom) {
    try {
      const parsed = JSON.parse(custom);
      out.push(...(Array.isArray(parsed) ? parsed : [parsed]));
    } catch {
      // Invalid custom JSON is rejected by the admin form; ignore defensively.
    }
  }
  return out;
}

export function listingJsonLd(mode, courses, origin) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: MODE_META[mode].listingTitle,
      itemListElement: courses.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${origin}${coursePath(mode, c.slug)}`,
        name: courseH1(c, mode),
      })),
    },
    breadcrumbLd(breadcrumbsFor(mode), origin),
  ];
}

export function whatsappLink(number, text) {
  const digits = String(number || '919810572736').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export const DAY_TYPE_LABEL = { weekday: 'Weekday', weekend: 'Weekend', daily: 'Daily' };

export const BATCH_STATUS_LABEL = { open: 'Open', filling: 'Filling Fast', full: 'Full', closed: 'Closed' };

// Same format the server stores on the order (functions/routes/payment.js).
export function batchLabel(b) {
  return `${DAY_TYPE_LABEL[b.dayType] || 'Weekday'} · ${b.timeLabel}${b.classroom ? ` · ${b.classroom}` : ''}`;
}
