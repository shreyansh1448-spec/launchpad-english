# Launch Pad English

The website for Launch Pad English (spoken English / IELTS / PTE coaching in
South Delhi) - React frontend, running entirely on Cloudflare Pages with
Pages Functions as the API and D1 as the database.

## What's included

- **Home** - hero slider, about section, services, course preview,
  database-driven photo gallery, combined Google Maps + Google reviews
  section, and site-wide verified-purchase reviews.
- **Offline Courses** / **Online Courses** - 5 detailed course sections each
  (Basic Spoken English, Advanced Spoken English, Complete Spoken English,
  IELTS Preparation, PTE Preparation), full syllabus, batch timings, pricing
  with strike-through MRP + offer price, and a Purchase button per course.
- **Blog**, **Counselling**, **FAQs**, **Contact** pages.
- Registration + payment modal: name, phone, email, address, then Razorpay
  Checkout (Razorpay's own flow handles RBI-mandated payment authentication,
  so there's no separate OTP step in the UI).
- Review system: 5-star rating, name, optional photo, text - gated so only
  someone with a verified (paid) purchase of that course can post.
- Admin panel (`/admin`) for editing course pricing/content, homepage
  photos/video/about text, gallery photos, reviews, blog posts, and orders -
  protected by JWT-based admin login, no redeploy needed for content changes.

## Project structure

```
frontend/
  src/               React (Vite) site
  functions/         Cloudflare Pages Functions API (Hono), served at /api/*
    routes/          courses, gallery, reviews, payment, blog, otp, leads, adminAuth, siteContent
    lib/             auth (JWT via jose), crypto, razorpay client, resend email
  public/images/     self-hosted photos (testimonials, blog)
  wrangler.toml      Cloudflare Pages project config (D1 + KV bindings)
db/
  schema.sql         D1 (SQLite) schema
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
