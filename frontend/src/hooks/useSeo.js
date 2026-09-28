import { useEffect } from 'react';

// Must match the defaults in index.html - restored when a page that set its
// own SEO tags unmounts, so e.g. /about never keeps a course's canonical URL.
const DEFAULT_TITLE = 'Launch Pad English - Spoken English, IELTS & PTE Coaching in Delhi';
const DEFAULT_DESCRIPTION =
  'Join Launch Pad English for expert Spoken English, IELTS and PTE training - online and offline batches in South Delhi.';

function addTag(tag, attrs, text) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  if (text) el.textContent = text;
  el.setAttribute('data-seo', '1');
  document.head.appendChild(el);
}

function setDescription(text) {
  let el = document.head.querySelector('meta[name="description"]');
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', 'description');
    document.head.appendChild(el);
  }
  el.setAttribute('content', text);
}

function clearTags() {
  document.head.querySelectorAll('[data-seo]').forEach((el) => el.remove());
}

// Client-side twin of functions/lib/seoPage.js: keeps <title>, description,
// canonical, Open Graph and JSON-LD in sync during in-app navigation. `seo`
// comes from shared/course.js (courseSeo / listingSeo) so both agree.
export default function useSeo(seo, jsonLd = []) {
  const key = seo ? JSON.stringify([seo, jsonLd]) : '';
  useEffect(() => {
    if (!seo) return undefined;
    document.title = seo.title;
    setDescription(seo.description);
    clearTags();
    addTag('link', { rel: 'canonical', href: seo.canonical });
    const og = {
      'og:type': seo.ogType || 'website',
      'og:site_name': 'Launch Pad English',
      'og:title': seo.ogTitle,
      'og:description': seo.ogDescription,
      'og:url': seo.canonical,
      'og:image': seo.ogImage,
    };
    for (const [property, content] of Object.entries(og)) if (content) addTag('meta', { property, content });
    addTag('meta', { name: 'twitter:card', content: 'summary_large_image' });
    if (seo.keywords) addTag('meta', { name: 'keywords', content: seo.keywords });
    if (seo.noindex) addTag('meta', { name: 'robots', content: 'noindex' });
    for (const block of jsonLd) addTag('script', { type: 'application/ld+json' }, JSON.stringify(block));

    return () => {
      clearTags();
      document.title = DEFAULT_TITLE;
      setDescription(DEFAULT_DESCRIPTION);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
