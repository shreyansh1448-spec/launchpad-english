require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Review = require('../models/Review');
const { TESTIMONIALS } = require('./importTestimonials');

// The initial import intentionally left `text` blank (photo/name/role only).
// This backfills the real testimonial quote onto each already-imported
// 'general' admin review, for the people who have one on the source page.
async function restoreText() {
  await connectDB();

  let updated = 0;
  let skippedNoText = 0;
  let skippedNotFound = 0;
  for (const t of TESTIMONIALS) {
    if (!t.text) {
      skippedNoText++;
      continue;
    }
    const result = await Review.updateOne(
      { name: t.name, courseSlug: 'general', source: 'admin' },
      { $set: { text: t.text } }
    );
    if (result.matchedCount === 0) {
      skippedNotFound++;
    } else {
      updated++;
    }
  }

  console.log(`Done. Updated ${updated}, skipped ${skippedNoText} (no text on source), ${skippedNotFound} not found.`);
  await mongoose.disconnect();
  process.exit(0);
}

restoreText().catch((err) => {
  console.error(err);
  process.exit(1);
});
