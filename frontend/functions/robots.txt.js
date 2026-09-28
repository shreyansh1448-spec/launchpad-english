// /robots.txt - points crawlers at the dynamic sitemap for whichever domain served the request.
export function onRequestGet({ request }) {
  const { origin } = new URL(request.url);
  return new Response(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${origin}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
