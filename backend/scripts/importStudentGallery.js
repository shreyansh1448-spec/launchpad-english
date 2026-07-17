require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Gallery = require('../models/Gallery');
const { TESTIMONIALS } = require('./importTestimonials');

// Adds every student photo (with name + profession as the caption/title) from
// the launchpadenglish.com testimonials page into the "Students" Gallery
// category, separate from the Reviews section.
async function importStudentGallery() {
  await connectDB();

  console.log(`Importing ${TESTIMONIALS.length} student gallery photos...`);
  let created = 0;
  let skipped = 0;
  let order = 0;
  for (const t of TESTIMONIALS) {
    if (!t.photo) {
      skipped++;
      continue;
    }
    const title = t.title && t.title !== 'Student' ? `${t.name} — ${t.title}` : t.name;
    const exists = await Gallery.findOne({ imageUrl: t.photo, category: 'student' });
    if (exists) {
      skipped++;
      continue;
    }
    await Gallery.create({
      title,
      imageUrl: t.photo,
      category: 'student',
      displayOrder: order++,
      active: true,
    });
    created++;
  }

  console.log(`Done. Created ${created}, skipped ${skipped}.`);
  await mongoose.disconnect();
  process.exit(0);
}

importStudentGallery().catch((err) => {
  console.error(err);
  process.exit(1);
});
