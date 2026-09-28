// Old deep-link format (/course/:mode/:slug) -> permanent redirect to the new
// /online-courses/:slug or /offline-courses/:slug URL.
export const onRequestGet = ({ request, params }) => {
  const mode = params.mode === 'offline' ? 'offline' : 'online';
  const { origin } = new URL(request.url);
  return Response.redirect(`${origin}/${mode}-courses/${encodeURIComponent(params.slug)}`, 301);
};
