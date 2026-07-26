// One-time export: reads every collection out of the production MongoDB
// (via MONGO_URI in backend/.env) and writes db/migration-data.sql - a set
// of D1-compatible INSERT statements matching db/schema.sql - for
// `wrangler d1 execute launchpad-english --file=db/migration-data.sql --remote`.
//
// IDs are carried over as the original Mongo ObjectId hex string (TEXT
// primary keys in D1), so order_id/course_id references stay valid with no
// remapping.
//
// The admin's bcrypt password hash is NOT migrated (Workers' free-plan CPU
// limit can't run bcrypt) - this script hashes a brand-new password with
// PBKDF2-SHA256 instead, using the same parameters as
// frontend/functions/lib/crypto.js so login works identically post-cutover.
//
// Usage (from backend/):
//   node scripts/migrateToD1.js --admin-password="a new strong password" [--admin-email=you@example.com]
//
// OtpSession is intentionally not migrated - it's ephemeral verification
// data with no lasting value, and the new backend stores it in Cloudflare KV.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const Admin = require('../models/Admin');
const ContactLead = require('../models/ContactLead');
const Course = require('../models/Course');
const Gallery = require('../models/Gallery');
const Order = require('../models/Order');
const Review = require('../models/Review');
const SiteContent = require('../models/SiteContent');

const PBKDF2_ITERATIONS = 100000; // must match frontend/functions/lib/crypto.js (Workers' crypto.subtle PBKDF2 cap)

const OUTPUT_PATH = path.join(__dirname, '..', '..', 'db', 'migration-data.sql');

function arg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

function sqlStr(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNum(value) {
  return value === null || value === undefined || Number.isNaN(Number(value)) ? 'NULL' : String(Number(value));
}

function sqlBool(value) {
  return value ? '1' : '0';
}

function sqlJson(value) {
  return sqlStr(JSON.stringify(value ?? null));
}

function sqlDate(value) {
  return value ? sqlStr(new Date(value).toISOString()) : 'NULL';
}

function hashPasswordPBKDF2(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, 32, 'sha256');
  return { hash: hash.toString('hex'), salt: salt.toString('hex') };
}

async function migrateAdmin(statements) {
  const adminPassword = arg('admin-password');
  if (!adminPassword) {
    console.warn('No --admin-password given - skipping admin migration. Pass --admin-password to create the D1 admin account.');
    return;
  }

  const existing = await Admin.findOne();
  const email = (arg('admin-email') || existing?.email || '').toLowerCase().trim();
  if (!email) {
    console.warn('No existing admin and no --admin-email given - skipping admin migration.');
    return;
  }

  const { hash, salt } = hashPasswordPBKDF2(adminPassword);
  const id = existing ? existing._id.toString() : crypto.randomUUID();
  statements.push(
    `INSERT INTO admins (id, email, password_hash, password_salt) VALUES (${sqlStr(id)}, ${sqlStr(email)}, ${sqlStr(hash)}, ${sqlStr(salt)});`
  );
  console.log(`Admin migrated: ${email} (new password set from --admin-password)`);
}

async function migrateContactLeads(statements) {
  const leads = await ContactLead.find({});
  for (const l of leads) {
    statements.push(
      `INSERT INTO contact_leads (id, type, name, phone, email, course_type, message, created_at) VALUES (${sqlStr(
        l._id
      )}, ${sqlStr(l.type)}, ${sqlStr(l.name)}, ${sqlStr(l.phone)}, ${sqlStr(l.email)}, ${sqlStr(l.courseType)}, ${sqlStr(
        l.message
      )}, ${sqlDate(l.createdAt)});`
    );
  }
  console.log(`Contact leads migrated: ${leads.length}`);
}

async function migrateCourses(statements) {
  const courses = await Course.find({});
  let resourceCount = 0;
  for (const c of courses) {
    statements.push(
      `INSERT INTO courses (
        id, slug, title, tagline, duration, level, overview,
        highlights, who_should_join, syllabus, daily_pattern, outcomes, batch_timings, faqs, images, thumbnail,
        pricing_online_mrp, pricing_online_offer, pricing_offline_mrp, pricing_offline_offer,
        display_order, active, featured, created_at, updated_at
      ) VALUES (
        ${sqlStr(c._id)}, ${sqlStr(c.slug)}, ${sqlStr(c.title)}, ${sqlStr(c.tagline)}, ${sqlStr(c.duration)}, ${sqlStr(c.level)}, ${sqlStr(c.overview)},
        ${sqlJson(c.highlights)}, ${sqlJson(c.whoShouldJoin)}, ${sqlJson(c.syllabus)}, ${sqlJson(c.dailyPattern)}, ${sqlJson(c.outcomes)}, ${sqlJson(c.batchTimings)}, ${sqlJson(c.faqs)}, ${sqlJson(c.images)}, ${sqlStr(c.thumbnail)},
        ${sqlNum(c.pricing?.online?.mrp)}, ${sqlNum(c.pricing?.online?.offer)}, ${sqlNum(c.pricing?.offline?.mrp)}, ${sqlNum(c.pricing?.offline?.offer)},
        ${sqlNum(c.displayOrder)}, ${sqlBool(c.active)}, ${sqlBool(c.featured)}, ${sqlDate(c.createdAt)}, ${sqlDate(c.updatedAt)}
      );`
    );
    for (const r of c.resources || []) {
      statements.push(
        `INSERT INTO course_resources (id, course_id, title, url) VALUES (${sqlStr(r._id)}, ${sqlStr(c._id)}, ${sqlStr(
          r.title
        )}, ${sqlStr(r.url)});`
      );
      resourceCount++;
    }
  }
  console.log(`Courses migrated: ${courses.length} (with ${resourceCount} resources)`);
}

async function migrateGallery(statements) {
  const items = await Gallery.find({});
  for (const g of items) {
    statements.push(
      `INSERT INTO gallery (id, title, media_type, image_url, video_url, category, course_slug, display_order, active, created_at, updated_at) VALUES (${sqlStr(
        g._id
      )}, ${sqlStr(g.title)}, ${sqlStr(g.mediaType)}, ${sqlStr(g.imageUrl)}, ${sqlStr(g.videoUrl)}, ${sqlStr(g.category)}, ${sqlStr(
        g.courseSlug
      )}, ${sqlNum(g.displayOrder)}, ${sqlBool(g.active)}, ${sqlDate(g.createdAt)}, ${sqlDate(g.updatedAt)});`
    );
  }
  console.log(`Gallery items migrated: ${items.length}`);
}

async function migrateOrders(statements) {
  const orders = await Order.find({});
  for (const o of orders) {
    statements.push(
      `INSERT INTO orders (
        id, name, phone, phone_verified, email, address, course_slug, course_title, mode, amount, currency,
        payment_method, razorpay_order_id, razorpay_payment_id, razorpay_signature, status, notes, created_at, updated_at
      ) VALUES (
        ${sqlStr(o._id)}, ${sqlStr(o.name)}, ${sqlStr(o.phone)}, ${sqlBool(o.phoneVerified)}, ${sqlStr(o.email)}, ${sqlStr(o.address)}, ${sqlStr(o.courseSlug)}, ${sqlStr(o.courseTitle)}, ${sqlStr(o.mode)}, ${sqlNum(o.amount)}, ${sqlStr(o.currency)},
        ${sqlStr(o.paymentMethod)}, ${sqlStr(o.razorpayOrderId)}, ${sqlStr(o.razorpayPaymentId)}, ${sqlStr(o.razorpaySignature)}, ${sqlStr(o.status)}, ${sqlStr(o.notes)}, ${sqlDate(o.createdAt)}, ${sqlDate(o.updatedAt)}
      );`
    );
  }
  console.log(`Orders migrated: ${orders.length}`);
  return orders;
}

async function migrateReviews(statements, validOrderIds) {
  const reviews = await Review.find({});
  let skipped = 0;
  for (const r of reviews) {
    // Only keep the order reference if that order was actually migrated -
    // otherwise the FK would violate referential integrity in D1.
    const orderId = r.order && validOrderIds.has(r.order.toString()) ? r.order.toString() : null;
    if (r.order && !orderId) skipped++;
    statements.push(
      `INSERT INTO reviews (id, order_id, source, course_slug, name, role, stars, text, photo_url, review_date, approved, featured, created_at, updated_at) VALUES (${sqlStr(
        r._id
      )}, ${sqlStr(orderId)}, ${sqlStr(r.source)}, ${sqlStr(r.courseSlug)}, ${sqlStr(r.name)}, ${sqlStr(r.role)}, ${sqlNum(
        r.stars
      )}, ${sqlStr(r.text)}, ${sqlStr(r.photoUrl)}, ${sqlDate(r.reviewDate)}, ${sqlBool(r.approved)}, ${sqlBool(
        r.featured
      )}, ${sqlDate(r.createdAt)}, ${sqlDate(r.updatedAt)});`
    );
  }
  console.log(`Reviews migrated: ${reviews.length}${skipped ? ` (${skipped} had a dangling order reference, set to NULL)` : ''}`);
}

async function migrateSiteContent(statements) {
  const content = await SiteContent.findOne();
  if (!content) {
    console.log('No site content document found - skipping (the app will auto-create defaults on first request).');
    return;
  }
  statements.push(
    `INSERT INTO site_content (
      id, site_name, tagline, about_title, about_text, phone, whatsapp, email, address,
      map_lat, map_lng, map_place_url, working_hours, youtube_url, social, hero_slides, batch_timings, stats
    ) VALUES (
      '1', ${sqlStr(content.siteName)}, ${sqlStr(content.tagline)}, ${sqlStr(content.aboutTitle)}, ${sqlStr(content.aboutText)}, ${sqlStr(content.phone)}, ${sqlStr(content.whatsapp)}, ${sqlStr(content.email)}, ${sqlStr(content.address)},
      ${sqlNum(content.mapLat)}, ${sqlNum(content.mapLng)}, ${sqlStr(content.mapPlaceUrl)}, ${sqlStr(content.workingHours)}, ${sqlStr(content.youtubeUrl)}, ${sqlJson(content.social)}, ${sqlJson(content.heroSlides)}, ${sqlJson(content.batchTimings)}, ${sqlJson(content.stats)}
    );`
  );
  console.log('Site content migrated.');
}

async function main() {
  await connectDB();
  const statements = ['DELETE FROM course_resources;', 'DELETE FROM reviews;', 'DELETE FROM orders;', 'DELETE FROM courses;', 'DELETE FROM gallery;', 'DELETE FROM contact_leads;', 'DELETE FROM site_content;', 'DELETE FROM admins;'];

  await migrateAdmin(statements);
  await migrateContactLeads(statements);
  await migrateCourses(statements);
  await migrateGallery(statements);
  const orders = await migrateOrders(statements);
  await migrateReviews(statements, new Set(orders.map((o) => o._id.toString())));
  await migrateSiteContent(statements);

  fs.writeFileSync(OUTPUT_PATH, statements.join('\n') + '\n');
  console.log(`\nWrote ${statements.length} statements to ${OUTPUT_PATH}`);
  console.log('Review the file, then apply it with:');
  console.log('  wrangler d1 execute launchpad-english --file=db/migration-data.sql --remote');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
