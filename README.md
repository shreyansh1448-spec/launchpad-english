# Launch Pad English - MERN Website

A full MongoDB + Express + React + Node.js website built for Launch Pad English
(spoken English / IELTS / PTE coaching), modeled on the navigation and layout
of languagepantheon.com, using the content from your uploaded course pages
and from launchpadenglish.com.

## What's included

- **Home** - hero slider (slide 1 = intro, slide 2 = the intro video
  `youtu.be/faFU7LFPtrw`), about section, services, course preview,
  database-driven photo gallery, combined Google Maps + Google reviews
  section, and site-wide verified-purchase reviews.
- **Offline Courses** / **Online Courses** - 5 detailed course sections each
  (Basic Spoken English, Advanced Spoken English, Complete Spoken English,
  IELTS Preparation, PTE Preparation), full syllabus, batch timings, pricing
  with strike-through MRP + offer price, and a Purchase button per course.
- **Counselling**, **FAQs**, **Contact** pages.
- Registration + payment modal: name, phone with OTP verification, email
  (no OTP), address, then Razorpay Checkout.
- Review system: 5-star rating, name, optional photo, text - gated so only
  someone with a verified (paid) purchase of that course can post.
- Everything editable from the database: course pricing/content
  (`Course`), homepage photos/video/about text (`SiteContent`), gallery
  photos (`Gallery`), reviews (`Review`).

## Project structure

```
launch/
  backend/     Express API + MongoDB models (the "database")
  frontend/    React (Vite) site
```

## 1. Prerequisites

- Node.js 18+
- A MongoDB database - either:
  - Local: install MongoDB Community Server and run it (`mongod`), or
  - Free cloud: create a free cluster at mongodb.com/atlas and copy its
    connection string.
- A Razorpay account (free to create) for the `key_id` / `key_secret`.

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:

- `MONGO_URI` - your MongoDB connection string.
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` - from Razorpay Dashboard >
  Settings > API Keys. Use the **Test Mode** keys first.
- `ADMIN_KEY` - any long random string, used to protect the admin-only
  endpoints (editing pricing, gallery, site content).

Load the 5 courses, default homepage content and starter gallery photos into
the database:

```bash
npm run seed
```

Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:5000`. Check `http://localhost:5000/api/health`.

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` to the
backend automatically (see `vite.config.js`), and `VITE_API_URL` in `.env`
points the app at `http://localhost:5000/api`.

## 4. How pricing / content is "in the database"

Every price, description, syllabus module, FAQ, and homepage photo/video
lives in MongoDB, not in the frontend code:

- **Course pricing**: `Course.pricing.online.{mrp,offer}` and
  `Course.pricing.offline.{mrp,offer}`. Update via:
  ```bash
  curl -X PUT http://localhost:5000/api/courses/basic-spoken-english \
    -H "Content-Type: application/json" \
    -H "x-admin-key: YOUR_ADMIN_KEY" \
    -d '{"pricing":{"online":{"mrp":18000,"offer":15000},"offline":{"mrp":18000,"offer":15000}}}'
  ```
  The site immediately reflects the new "₹18,000 [struck through] ₹15,000
  Only" pricing everywhere that course appears - no redeploy needed.
- **Homepage hero slides, about text, address, map, stats**: `SiteContent`
  document, editable via `PUT /api/site-content` (same `x-admin-key`
  header).
- **Gallery photos**: `Gallery` collection, editable via `POST/PUT/DELETE
  /api/gallery`.
- **Reviews**: `Review` collection - moderate/delete directly in the
  database or build an admin screen on top of the existing routes.

For quick edits without curl, use a GUI like MongoDB Compass connected to
your `MONGO_URI`, or build a small internal admin page later - all the
write endpoints already exist.

## 5. Going live: things to replace before real customers use this

This project is a fully working demo end-to-end (registration, OTP,
payment, reviews, gallery, map) using safe placeholders where a paid
third-party account is required. Before accepting real money/OTPs:

### Razorpay
- Currently uses your `RAZORPAY_KEY_ID`/`RAZORPAY_KEY_SECRET` from `.env` in
  **test mode**. Switch to your live keys (`rzp_live_...`) once KYC is
  approved on your Razorpay account, and keep `RAZORPAY_KEY_SECRET` only on
  the backend (never in frontend code) - it already is.
- Payment signature verification is already implemented correctly
  (`backend/routes/payment.js`, HMAC-SHA256 per Razorpay's docs).

### OTP / SMS
- `backend/routes/otp.js` currently generates the OTP and returns it in the
  API response (`devOtp`) so the flow works without a paid SMS account. This
  is clearly commented as **demo mode**.
- To go live, sign up with an SMS provider (MSG91, Twilio, or 2Factor are
  common in India), and inside `routes/otp.js`'s `/send` handler, call their
  API to actually text the OTP to `phone`, then remove `devOtp` from the
  response.

### Google Reviews
- No Google Places API key was provided, so the "Google Reviews" section on
  the Home/Contact pages shows curated real testimonials from
  launchpadenglish.com styled like Google reviews, plus a working "View All
  Reviews on Google" link and a live, keyless Google Maps embed of your
  exact location (Green Park, South Delhi).
- To show a *live* Places rating/review feed, get a Google Places API key
  (Google Cloud Console > enable "Places API") and swap the static
  `GOOGLE_REVIEWS` array in `frontend/src/components/GoogleMapReviews.jsx`
  for a fetch to the Places Details endpoint (proxied through your backend,
  since the API key must stay server-side).

### Review photo storage
- Review photos are currently accepted as base64 data URLs and stored
  directly in MongoDB (fine for a demo/small site). For production at
  scale, upload to S3/Cloudinary instead and store the resulting URL in
  `Review.photoUrl`.

### Admin key
- The `x-admin-key` header check is intentionally simple. For a real admin
  panel, replace it with proper authenticated admin login (e.g. JWT +
  bcrypt-hashed admin user) before exposing write endpoints publicly.

## 6. Deployment notes

- Backend: any Node host (Render, Railway, a VPS) + MongoDB Atlas.
- Frontend: `npm run build` in `frontend/` produces static files
  (`frontend/dist`) deployable to Vercel, Netlify, or any static host - just
  set `VITE_API_URL` to your deployed backend's URL before building.
- Set `MONGO_URI`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `ADMIN_KEY`
  as environment variables on your host - don't commit `.env`.
