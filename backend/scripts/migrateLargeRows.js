// Follow-up to migrateToD1.js: handles the handful of rows whose base64
// image/photo content is too large to embed as a literal SQL string (D1/
// SQLite rejects compiled statements over its max length - "statement too
// long: SQLITE_TOOBIG"). Uses the D1 HTTP API with real parameter binding
// instead of inlining the value into the SQL text, since only the *compiled
// statement text* has a length ceiling - a bound parameter value does not.
//
// Usage: node scripts/migrateLargeRows.js
require('dotenv').config();
const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Gallery = require('../models/Gallery');
const Review = require('../models/Review');

const ACCOUNT_ID = '6c1992f14dffc21f0b093d631067d722';
const DATABASE_ID = 'ef5c7321-df58-40aa-aa72-1949379d9fe0';

const GALLERY_IDS = ['6a5dc905e165b0ee4863f4a4', '6a5dcdcf95525d07111e3074'];
const REVIEW_IDS = ['6a5a51adeff22ea7a51e9f2a', '6a5b7484c3cb51266fc3c23c', '6a5db9926ebf2572ebfffd75'];

function readOauthToken() {
  const configPath = path.join(os.homedir(), 'AppData', 'Roaming', 'xdg.config', '.wrangler', 'config', 'default.toml');
  const content = fs.readFileSync(configPath, 'utf8');
  const match = content.match(/oauth_token\s*=\s*"([^"]+)"/);
  if (!match) throw new Error('Could not find oauth_token in wrangler config');
  return match[1];
}

async function d1Query(token, sql, params) {
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ sql, params }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(`D1 query failed: ${JSON.stringify(data.errors || data)}`);
  }
  return data;
}

async function main() {
  const token = readOauthToken();
  await connectDB();

  const failures = [];

  for (const id of GALLERY_IDS) {
    const g = await Gallery.findById(id);
    if (!g) {
      console.warn(`Gallery ${id} not found, skipping`);
      continue;
    }
    const size = (g.imageUrl?.length || 0) + (g.videoUrl?.length || 0);
    try {
      await d1Query(
        token,
        `INSERT OR REPLACE INTO gallery (id, title, media_type, image_url, video_url, category, course_slug, display_order, active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          g._id.toString(),
          g.title,
          g.mediaType,
          g.imageUrl,
          g.videoUrl,
          g.category,
          g.courseSlug,
          g.displayOrder,
          g.active ? 1 : 0,
          g.createdAt.toISOString(),
          g.updatedAt.toISOString(),
        ]
      );
      console.log(`OK: gallery ${id} inserted (${size} chars of media data)`);
    } catch (err) {
      console.error(`FAILED: gallery ${id} (${size} chars) - ${err.message}`);
      failures.push({ table: 'gallery', id, size, title: g.title });
    }
  }

  for (const id of REVIEW_IDS) {
    const r = await Review.findById(id);
    if (!r) {
      console.warn(`Review ${id} not found, skipping`);
      continue;
    }
    const size = r.photoUrl?.length || 0;
    try {
      await d1Query(
        token,
        `INSERT OR REPLACE INTO reviews (id, order_id, source, course_slug, name, role, stars, text, photo_url, review_date, approved, featured, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          r._id.toString(),
          r.order ? r.order.toString() : null,
          r.source,
          r.courseSlug,
          r.name,
          r.role || '',
          r.stars,
          r.text || '',
          r.photoUrl || '',
          r.reviewDate ? new Date(r.reviewDate).toISOString() : null,
          r.approved ? 1 : 0,
          r.featured ? 1 : 0,
          r.createdAt.toISOString(),
          r.updatedAt.toISOString(),
        ]
      );
      console.log(`OK: review ${id} inserted (${size} chars of photo data)`);
    } catch (err) {
      console.error(`FAILED: review ${id} (${size} chars) - ${err.message}`);
      failures.push({ table: 'reviews', id, size, name: r.name });
    }
  }

  if (failures.length) {
    console.log('\n--- Rows that could not be inserted (too large for D1) ---');
    console.log(JSON.stringify(failures, null, 2));
  }

  console.log('Done.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
