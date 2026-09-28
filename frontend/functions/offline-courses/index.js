// /offline-courses - listing page with server-injected SEO (see lib/seoPage.js).
import { renderListingPage } from '../lib/seoPage.js';

export const onRequestGet = (ctx) => renderListingPage(ctx, 'offline');
