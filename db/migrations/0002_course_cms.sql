-- Migration 0002: course CMS restructure.
--
-- Run once against an existing database (created from the pre-CMS schema):
--   wrangler d1 execute launchpad-english --file=../db/migrations/0002_course_cms.sql --local
--   wrangler d1 execute launchpad-english --file=../db/migrations/0002_course_cms.sql --remote
--
-- Fresh installs don't need this - db/schema.sql already includes everything
-- below. Existing course content, prices, reviews, orders and gallery rows
-- are all kept; only new columns/tables are added and course slugs are
-- renamed to the new SEO URLs (with the old slugs kept as redirects).

-- ---------------------------------------------------------------- courses
ALTER TABLE courses ADD COLUMN category TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN short_description TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN full_description TEXT NOT NULL DEFAULT '';   -- rich-text HTML
ALTER TABLE courses ADD COLUMN offer_online INTEGER NOT NULL DEFAULT 1;
ALTER TABLE courses ADD COLUMN offer_offline INTEGER NOT NULL DEFAULT 1;
ALTER TABLE courses ADD COLUMN currency TEXT NOT NULL DEFAULT 'INR';
ALTER TABLE courses ADD COLUMN details TEXT NOT NULL DEFAULT '{}';         -- JSON {numClasses,classDuration,assessments,mockTests,studyMaterial,certificate}
ALTER TABLE courses ADD COLUMN hero_image TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN promo_video TEXT NOT NULL DEFAULT '';
ALTER TABLE courses ADD COLUMN instructor TEXT NOT NULL DEFAULT '{}';      -- JSON {name,title,bio,image}
ALTER TABLE courses ADD COLUMN mode_content TEXT NOT NULL DEFAULT '{}';    -- JSON {online:{headline,intro},offline:{headline,intro}}
ALTER TABLE courses ADD COLUMN seo TEXT NOT NULL DEFAULT '{}';             -- JSON {online:{...},offline:{...},customSchema}
ALTER TABLE courses ADD COLUMN legacy_slugs TEXT NOT NULL DEFAULT '[]';    -- JSON array, old slugs that 301 to this course

-- New SEO-friendly slugs (/online-courses/ielts-preparation etc.).
UPDATE courses SET legacy_slugs = '["complete-basic-advanced-spoken-english"]', slug = 'complete-spoken-english'
  WHERE slug = 'complete-basic-advanced-spoken-english';
UPDATE courses SET legacy_slugs = '["ielts-preparation-course"]', slug = 'ielts-preparation'
  WHERE slug = 'ielts-preparation-course';
UPDATE courses SET legacy_slugs = '["pte-preparation-course"]', slug = 'pte-preparation'
  WHERE slug = 'pte-preparation-course';

UPDATE orders SET course_slug = 'complete-spoken-english' WHERE course_slug = 'complete-basic-advanced-spoken-english';
UPDATE orders SET course_slug = 'ielts-preparation' WHERE course_slug = 'ielts-preparation-course';
UPDATE orders SET course_slug = 'pte-preparation' WHERE course_slug = 'pte-preparation-course';
UPDATE reviews SET course_slug = 'complete-spoken-english' WHERE course_slug = 'complete-basic-advanced-spoken-english';
UPDATE reviews SET course_slug = 'ielts-preparation' WHERE course_slug = 'ielts-preparation-course';
UPDATE reviews SET course_slug = 'pte-preparation' WHERE course_slug = 'pte-preparation-course';
UPDATE gallery SET course_slug = 'complete-spoken-english' WHERE course_slug = 'complete-basic-advanced-spoken-english';
UPDATE gallery SET course_slug = 'ielts-preparation' WHERE course_slug = 'ielts-preparation-course';
UPDATE gallery SET course_slug = 'pte-preparation' WHERE course_slug = 'pte-preparation-course';

-- Reuse existing copy for the new fields so nothing starts blank.
UPDATE courses SET category = 'Spoken English'
  WHERE slug IN ('basic-spoken-english', 'advanced-spoken-english', 'complete-spoken-english');
UPDATE courses SET category = 'Exam Preparation' WHERE slug IN ('ielts-preparation', 'pte-preparation');
UPDATE courses SET category = 'General English' WHERE category = '';

UPDATE courses SET short_description = tagline WHERE short_description = '';
UPDATE courses SET full_description =
  '<p>' || replace(replace(replace(overview, '&', '&amp;'), '<', '&lt;'), '>', '&gt;') || '</p>'
  WHERE full_description = '';

UPDATE courses SET details = json_object(
  'numClasses', '',
  'classDuration', '',
  'assessments', 'Weekly assessments with personalised trainer feedback',
  'mockTests', CASE WHEN slug IN ('ielts-preparation', 'pte-preparation')
                    THEN 'Weekly mock activities plus full-length mock exams' ELSE '' END,
  'studyMaterial', 'Included in the course fee',
  'certificate', 'Course completion certificate included'
) WHERE details = '{}';

-- ---------------------------------------------------------------- batches
-- course_id NULL = a batch slot offered for every course in that mode.
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('online', 'offline')),
  day_type TEXT NOT NULL DEFAULT 'weekday' CHECK (day_type IN ('weekday', 'weekend', 'daily')),
  time_label TEXT NOT NULL,
  classroom TEXT NOT NULL DEFAULT '',
  seats_available INTEGER,            -- NULL = not tracked; decremented on each paid enrollment
  start_date TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'filling', 'full', 'closed')),
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE INDEX IF NOT EXISTS idx_batches_course_mode ON batches(course_id, mode);

INSERT INTO batches (id, course_id, mode, day_type, time_label, classroom, display_order) VALUES
  ('seed-on-1', NULL, 'online', 'weekday', '9:00 AM - 11:00 AM', '', 1),
  ('seed-on-2', NULL, 'online', 'weekday', '11:00 AM - 1:00 PM', '', 2),
  ('seed-on-3', NULL, 'online', 'weekday', '1:00 PM - 3:00 PM', '', 3),
  ('seed-on-4', NULL, 'online', 'weekday', '9:00 PM - 10:30 PM', '', 4),
  ('seed-off-1', NULL, 'offline', 'weekday', '3:00 PM - 5:00 PM', 'Green Park Campus', 1),
  ('seed-off-2', NULL, 'offline', 'weekday', '4:00 PM - 6:00 PM', 'Green Park Campus', 2),
  ('seed-off-3', NULL, 'offline', 'weekday', '5:00 PM - 7:00 PM', 'Green Park Campus', 3),
  ('seed-off-4', NULL, 'offline', 'weekday', '6:00 PM - 8:00 PM', 'Green Park Campus', 4),
  ('seed-off-5', NULL, 'offline', 'weekday', '7:00 PM - 9:00 PM', 'Green Park Campus', 5);

-- ---------------------------------------------------------------- media
-- Admin-uploaded images (course thumbnails, hero, gallery, editor images),
-- served from /api/media/:id. Images are resized in the browser before upload.
CREATE TABLE IF NOT EXISTS media (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL DEFAULT '',
  mime TEXT NOT NULL,
  size INTEGER NOT NULL DEFAULT 0,
  data TEXT NOT NULL,                 -- base64
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ---------------------------------------------------------------- orders
ALTER TABLE orders ADD COLUMN batch_id TEXT;
ALTER TABLE orders ADD COLUMN batch_label TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN confirmation_sent INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
