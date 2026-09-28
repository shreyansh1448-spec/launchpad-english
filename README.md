# Launch Pad English

The website for Launch Pad English (spoken English / IELTS / PTE coaching in
South Delhi) - React frontend, running entirely on Cloudflare Pages with
Pages Functions as the API and D1 as the database.

## What's included

- **Home** - hero slider, about section, services, separate Learn Online /
  Learn Offline course sections,
  database-driven photo gallery, combined Google Maps + Google reviews
  section, and site-wide verified-purchase reviews.
- **Online Courses** (`/online-courses`) and **Offline Courses**
  (`/offline-courses`) - two completely separate catalogs. Each lists only
  the courses offered in that mode, with only that mode's price.
- **One page per course per mode** - `/online-courses/<slug>` and
  `/offline-courses/<slug>` (e.g. `/online-courses/ielts-preparation`), all
  rendered from the database through one template (`CourseDetailView`):
  hero with price/discount/CTAs, curriculum, features, course details, batch
  timings, gallery, FAQs, reviews and related courses in the same mode.
- **SEO** - course and listing pages get their own `<title>`, meta
  description, canonical, Open Graph tags and Course / FAQPage /
  BreadcrumbList JSON-LD injected server-side (`functions/lib/seoPage.js`),
  plus a dynamic `/sitemap.xml` and `/robots.txt`. Renamed slugs 301 to the
  new URL automatically.
- **Blog**, **Counselling**, **FAQs**, **Contact** pages.
- Registration + payment modal: name, phone, email, address, then Razorpay
  Checkout (Razorpay's own flow handles RBI-mandated payment authentication,
  so there's no separate OTP step in the UI).
- Review system: 5-star rating, name, optional photo, text - gated so only
  someone with a verified (paid) purchase of that course can post.
- **Admin CMS** (`/admin`) - dashboard (courses, batches, enrollments,
  revenue), course table with Add / Edit / Duplicate / Preview / Publish /
  Unpublish / Delete, and a no-code course editor: course info, online and
  offline pricing (discount calculated automatically), rich-text
  description, features, drag-and-drop curriculum (modules + topics), image
  and video uploads, per-mode SEO, FAQs and batches. Also batch timings,
  students, orders (search + filters + CSV export), leads, home page, site
  content, gallery, blog and reviews. No redeploy is needed for any of it.
- **Payments** - the Razorpay amount is always looked up from the database
  on the server (never taken from the browser), along with the course, mode
  and chosen batch; seats go down on each paid enrollment and a confirmation
  email is sent via Resend.

## Project structure

```
frontend/
  src/               React (Vite) site
  functions/         Cloudflare Pages Functions API (Hono), served at /api/*
    routes/          courses, batches, media, dashboard, payment, gallery, reviews,
                     blog, otp, leads, adminAuth, siteContent
    online-courses/, offline-courses/   server-rendered SEO for course pages
    lib/             auth (JWT via jose), crypto, razorpay client, resend email
  shared/            course helpers used by both the app and the Functions
                     (URLs, pricing, SEO / JSON-LD)
  public/images/     self-hosted photos (testimonials, blog)
  wrangler.toml      Cloudflare Pages project config (D1 + KV bindings)
db/
  schema.sql         D1 (SQLite) schema (fresh installs)
  migrations/        one-off upgrades for an existing database
  blog_seed*.sql     WordPress blog import seed data
```

## 1. Prerequisites

- Node.js 18+
- A Cloudflare account with `wrangler` (installed as a frontend dev
  dependency) logged in: `npx wrangler login`
- A Razorpay account for the `key_id` / `key_secret`

## 2. First-time setup

From `frontend/`:

```bash
npm install
wrangler d1 create launchpad-english      # copy the printed database_id into wrangler.toml
wrangler kv namespace create OTP_KV       # copy the printed id into wrangler.toml
wrangler d1 execute launchpad-english --file=../db/schema.sql --local
wrangler d1 execute launchpad-english --file=../db/schema.sql --remote
```

### Upgrading an existing database

The course CMS (separate online/offline pages, batches table, image
uploads, new course fields) needs one migration on a database created from
the older schema. It keeps all existing courses, prices, orders, reviews and
gallery rows, and renames three course slugs to the new URLs (old URLs keep
working via 301):

```bash
wrangler d1 execute launchpad-english --file=../db/migrations/0002_course_cms.sql --remote
```

Run it once (use `--local` for your local dev database), **before** deploying
the new code.

Set secrets (production):

```bash
wrangler pages secret put JWT_SECRET
wrangler pages secret put RAZORPAY_KEY_ID
wrangler pages secret put RAZORPAY_KEY_SECRET
wrangler pages secret put RESEND_API_KEY
wrangler pages secret put RESEND_FROM_EMAIL
```

For local dev, put the same values in `frontend/.dev.vars` (not committed).

## 3. Running locally

```bash
cd frontend
npm run pages:dev
```

This builds the frontend and serves it together with the Pages Functions API
and a local D1/KV emulator (Miniflare) at `http://localhost:8788` - the
closest match to production. Re-run after frontend source changes (no hot
reload on this path).

For frontend-only work with hot reload, `npm run dev` starts a plain Vite
dev server on `:5173`, but `/api/*` calls won't work since Functions aren't
served that way.

## 4. Deploying

```bash
cd frontend
npm run pages:deploy
```

This runs `vite build` then `wrangler pages deploy`, publishing a new
production deployment. **Cloudflare Pages secrets set via `wrangler pages
secret put` only take effect on the next deployment** - if you rotate a
secret, redeploy immediately after.

## 5. Content editing

Everything below is edited live from the admin panel at `/admin` (course
pricing, homepage content, gallery, reviews, blog, orders) - changes show up
immediately, no redeploy needed. Admin login uses a JWT session (`jose`,
Workers-compatible), verified by `requireAdmin` in
`frontend/functions/lib/auth.js`.

## 6. Known "demo mode" pieces

- **Phone OTP** (`frontend/functions/routes/otp.js`) - generates and stores
  the OTP in KV, but returns it directly in the API response (`devOtp`)
  since no SMS provider is wired in. Not currently used by the registration
  flow (Razorpay Checkout handles payment authentication instead), but the
  endpoint exists for future use - wire in a real SMS provider (MSG91,
  Twilio, 2Factor) before relying on it.
- **Google Reviews** - the Home/Contact pages show curated real testimonials
  styled like Google reviews (`frontend/src/components/GoogleMapReviews.jsx`)
  plus a live, keyless Google Maps embed, rather than a live Google Places
  API feed.
