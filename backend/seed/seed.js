require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Course = require('../models/Course');
const SiteContent = require('../models/SiteContent');
const Gallery = require('../models/Gallery');
const coursesData = require('./coursesData');

// Real testimonials gathered from launchpadenglish.com, reused here as
// starter Gallery/showcase content. Delete or replace via /api/gallery once
// you have your own photos - everything here is just seed data, not fixed
// content.
const galleryData = [
  { title: 'Classroom training session', imageUrl: 'https://www.launchpadenglish.com/wp-content/uploads/2024/12/launch-pad-1.webp', category: 'classroom', displayOrder: 1 },
  { title: 'Spoken English batch', imageUrl: 'https://www.launchpadenglish.com/wp-content/uploads/2024/09/english-spoken-150x150.jpg', category: 'classroom', displayOrder: 2 },
  { title: 'Group discussion practice', imageUrl: 'https://www.launchpadenglish.com/wp-content/uploads/2024/09/Group-discussion-150x150.jpg', category: 'event', displayOrder: 3 },
  { title: 'Our faculty team', imageUrl: 'https://www.launchpadenglish.com/wp-content/uploads/2024/09/Launch-Pad-Team.jpg', category: 'other', displayOrder: 4 },
  { title: 'Personality development session', imageUrl: 'https://www.launchpadenglish.com/wp-content/uploads/2024/09/Personality-Development-150x150.jpg', category: 'event', displayOrder: 5 },
  { title: 'IELTS/PTE exam coaching', imageUrl: 'https://www.launchpadenglish.com/wp-content/uploads/2024/09/IELTS_-PTE_-OET-exams-150x150.jpg', category: 'classroom', displayOrder: 6 },
];

async function seed() {
  await connectDB();

  console.log('Seeding courses...');
  for (const c of coursesData) {
    await Course.findOneAndUpdate({ slug: c.slug }, c, { upsert: true, setDefaultsOnInsert: true });
    console.log(' -', c.title);
  }

  console.log('Seeding site content...');
  const existing = await SiteContent.findOne();
  if (!existing) {
    await SiteContent.create({
      aboutText:
        'Welcome to Launch Pad English, a trusted English speaking institute in South Delhi with 15+ years of experience. We help students, job seekers, professionals and competitive-exam aspirants speak English fluently and confidently through Spoken English, IELTS and PTE coaching - both online and offline. Our courses build a strong foundation in grammar and vocabulary, live speaking practice, pronunciation training, personality development, and interview coaching, so you are ready for academic, professional and everyday communication in English.',
    });
    console.log(' - default site content created');
  } else {
    console.log(' - site content already exists, skipped');
  }

  console.log('Seeding gallery...');
  const galleryCount = await Gallery.countDocuments();
  if (galleryCount === 0) {
    await Gallery.insertMany(galleryData);
    console.log(` - inserted ${galleryData.length} gallery photos`);
  } else {
    console.log(' - gallery already has photos, skipped');
  }

  console.log('Done.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
