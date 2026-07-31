-- Cloudflare D1 schema for Launch Pad English.
-- IDs are TEXT everywhere: migrated rows keep their original MongoDB
-- ObjectId hex string, new rows get crypto.randomUUID() at insert time.
-- Boolean columns are stored as INTEGER (0/1), matching SQLite convention.

CREATE TABLE admins (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  reset_token_hash TEXT NOT NULL DEFAULT '',
  reset_token_expiry TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE contact_leads (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('contact', 'counselling')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  course_type TEXT NOT NULL DEFAULT '' CHECK (course_type IN ('online', 'offline', '')),
  message TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_contact_leads_created_at ON contact_leads(created_at);

CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL,
  duration TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'All Levels',
  overview TEXT NOT NULL,
  highlights TEXT NOT NULL DEFAULT '[]',        -- JSON array of strings
  who_should_join TEXT NOT NULL DEFAULT '[]',   -- JSON array of strings
  syllabus TEXT NOT NULL DEFAULT '[]',          -- JSON array of {module, points[]}
  daily_pattern TEXT NOT NULL DEFAULT '[]',     -- JSON array of strings
  outcomes TEXT NOT NULL DEFAULT '[]',          -- JSON array of strings
  batch_timings TEXT NOT NULL DEFAULT '{"online":[],"offline":[]}', -- JSON {online[],offline[]}
  faqs TEXT NOT NULL DEFAULT '[]',              -- JSON array of {q,a}
  images TEXT NOT NULL DEFAULT '[]',            -- JSON array of {url,caption}
  thumbnail TEXT NOT NULL DEFAULT '',
  pricing_online_mrp REAL NOT NULL,
  pricing_online_offer REAL NOT NULL,
  pricing_offline_mrp REAL NOT NULL,
  pricing_offline_offer REAL NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE course_resources (
  id TEXT PRIMARY KEY,
  course_id TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_course_resources_course_id ON course_resources(course_id);

CREATE TABLE gallery (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  media_type TEXT NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  image_url TEXT NOT NULL DEFAULT '',
  video_url TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'classroom' CHECK (category IN ('classroom', 'event', 'student', 'certificate', 'other')),
  course_slug TEXT NOT NULL DEFAULT '',
  display_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_gallery_category ON gallery(category);
CREATE INDEX idx_gallery_display_order ON gallery(display_order);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  phone_verified INTEGER NOT NULL DEFAULT 0,
  email TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  course_slug TEXT NOT NULL,
  course_title TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('online', 'offline')),
  amount REAL NOT NULL,          -- paise
  currency TEXT NOT NULL DEFAULT 'INR',
  payment_method TEXT NOT NULL DEFAULT 'razorpay' CHECK (payment_method IN ('razorpay', 'cash')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_orders_phone ON orders(phone);
CREATE INDEX idx_orders_course_slug ON orders(course_slug);
CREATE INDEX idx_orders_razorpay_order_id ON orders(razorpay_order_id);

CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'purchase' CHECK (source IN ('purchase', 'admin')),
  course_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT '',
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  text TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  review_date TEXT,
  approved INTEGER NOT NULL DEFAULT 1,
  featured INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
-- SQLite treats multiple NULLs as non-colliding under a UNIQUE index, which
-- matches Mongo's partial-unique-index behavior (unique only among real
-- order ids; admin-added reviews with a NULL order_id are exempt).
CREATE UNIQUE INDEX idx_reviews_order_id ON reviews(order_id);
CREATE INDEX idx_reviews_course_slug ON reviews(course_slug);

CREATE TABLE blog_posts (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',   -- sanitized HTML, rendered as-is on the detail page
  thumbnail TEXT NOT NULL DEFAULT '',
  published_at TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at);

CREATE TABLE site_content (
  id TEXT PRIMARY KEY DEFAULT '1',
  site_name TEXT NOT NULL DEFAULT 'Launch Pad English',
  tagline TEXT NOT NULL DEFAULT 'Speak Confidently, Succeed Globally',
  about_title TEXT NOT NULL DEFAULT 'About Launch Pad English',
  about_text TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '+91 98105 72736',
  whatsapp TEXT NOT NULL DEFAULT '919810572736',
  email TEXT NOT NULL DEFAULT 'launchpadenglish@gmail.com',
  address TEXT NOT NULL DEFAULT '',
  map_lat REAL NOT NULL DEFAULT 28.558361,
  map_lng REAL NOT NULL DEFAULT 77.2081812,
  map_place_url TEXT NOT NULL DEFAULT '',
  working_hours TEXT NOT NULL DEFAULT 'Mon - Sat, 9:00 AM - 9:00 PM',
  youtube_url TEXT NOT NULL DEFAULT '',
  social TEXT NOT NULL DEFAULT '{"facebook":"","instagram":"","linkedin":"","youtube":"","x":""}',
  hero_slides TEXT NOT NULL DEFAULT '[]',
  batch_timings TEXT NOT NULL DEFAULT '{"onlineWeekday":[],"onlineWeekend":[],"offlineWeekday":[],"offlineWeekend":[]}',
  stats TEXT NOT NULL DEFAULT '{"studentsCount":10000,"yearsExperience":15,"successRate":100,"coursesCount":0}'
);
