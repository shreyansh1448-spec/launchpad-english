import { Hono } from 'hono';

import coursesRoutes from './routes/courses.js';
import otpRoutes from './routes/otp.js';
import paymentRoutes from './routes/payment.js';
import reviewsRoutes from './routes/reviews.js';
import leadsRoutes from './routes/leads.js';
import galleryRoutes from './routes/gallery.js';
import siteContentRoutes from './routes/siteContent.js';
import adminAuthRoutes from './routes/adminAuth.js';

const app = new Hono().basePath('/api');

app.get('/health', (c) => c.json({ ok: true, service: 'launchpad-english-api' }));

app.route('/courses', coursesRoutes);
app.route('/otp', otpRoutes);
app.route('/payment', paymentRoutes);
app.route('/reviews', reviewsRoutes);
app.route('/leads', leadsRoutes);
app.route('/gallery', galleryRoutes);
app.route('/site-content', siteContentRoutes);
app.route('/admin', adminAuthRoutes);

app.notFound((c) => c.json({ error: 'Not found' }, 404));
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
