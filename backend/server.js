require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');

const coursesRoutes = require('./routes/courses');
const otpRoutes = require('./routes/otp');
const paymentRoutes = require('./routes/payment');
const reviewsRoutes = require('./routes/reviews');
const leadsRoutes = require('./routes/leads');
const galleryRoutes = require('./routes/gallery');
const siteContentRoutes = require('./routes/siteContent');
const adminAuthRoutes = require('./routes/adminAuth');

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' })); // 5mb headroom for base64 review photos

connectDB().then(bootstrapAdmin);

// Creates the first admin account from ADMIN_EMAIL/ADMIN_PASSWORD in .env if
// no admin exists yet - so there's always a way to log in on a fresh DB
// without a separate seed step. No-op once an admin already exists (use
// "Forgot password" or "Change email" from the admin panel after that).
async function bootstrapAdmin() {
  const existing = await Admin.findOne();
  if (existing) return;

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('No admin account exists yet, and ADMIN_EMAIL/ADMIN_PASSWORD are not set in .env - set them and restart to create one.');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await Admin.create({ email: email.toLowerCase().trim(), passwordHash });
  console.log(`Admin account created for ${email} - log in at /admin/login (change the password after first login).`);
}

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'launchpad-english-api' }));

app.use('/api/courses', coursesRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/admin', adminAuthRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Launch Pad English API running on port ${PORT}`));
