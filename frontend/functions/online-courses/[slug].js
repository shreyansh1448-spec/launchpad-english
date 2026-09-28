// /online-courses/:slug - course page with server-injected SEO (see lib/seoPage.js).
import { renderCoursePage } from '../lib/seoPage.js';

export const onRequestGet = (ctx) => renderCoursePage(ctx, 'online');
