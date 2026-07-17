const mongoose = require('mongoose');

const HeroSlideSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    heading: String,
    subheading: String,
    description: { type: String, default: '' },
    highlights: { type: [String], default: [] }, // short checkmark cards, e.g. "Basic to Advance"
    imageUrl: String,
    videoUrl: String, // YouTube embed URL, used when type === 'video'
    ctaText: String,
    ctaSubtext: { type: String, default: '' }, // small tagline under the CTA button, e.g. "Feel the Difference!"
    ctaLink: String,
  },
  { _id: false }
);

// Singleton document (there should only ever be one - routes/siteContent.js
// creates a default automatically if missing). Holds every piece of
// homepage/site content the business should be able to change without
// touching code: hero slides (including the intro-video slide), the about
// section, contact details, map location, and headline stats/photos.
const SiteContentSchema = new mongoose.Schema({
  siteName: { type: String, default: 'Launch Pad English' },
  tagline: { type: String, default: 'Speak Confidently. Communicate Professionally. Succeed Globally.' },
  aboutTitle: { type: String, default: 'About Launch Pad English' },
  aboutText: { type: String, default: '' },
  phone: { type: String, default: '+91 98105 72736' },
  whatsapp: { type: String, default: '919810572736' },
  email: { type: String, default: 'launchpadenglish@gmail.com' },
  address: {
    type: String,
    default: 'Thapar House, behind Axis Bank, Gautam Nagar, Green Park Metro Station Gate No. 2, New Delhi, 110049',
  },
  mapLat: { type: Number, default: 28.558361 },
  mapLng: { type: Number, default: 77.2081812 },
  mapPlaceUrl: {
    type: String,
    default: 'https://maps.app.goo.gl/FRorYAGZGYHqL8Z96',
  },
  workingHours: { type: String, default: 'Mon - Sat, 9:00 AM - 9:00 PM' },
  social: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    youtube: { type: String, default: '' },
    x: { type: String, default: '' },
  },
  heroSlides: {
    type: [HeroSlideSchema],
    default: [
      {
        type: 'image',
        heading: 'Speak English fluently, clearly, & confidently.',
        subheading: 'Learn English through the Fastest Technology',
        description:
          "Whether you're a student, professional, or job seeker - we help you achieve your goals with practical English.",
        highlights: [
          'Basic to Advance',
          'Online & Offline Classes Available',
          'Prepare for IELTS / PTE',
          'Flexible Batches',
          'Weekday & Weekend',
        ],
        imageUrl: '/images/launchpad-banner.jfif',
        ctaText: 'Join Now',
        ctaSubtext: '',
        ctaLink: '/online-courses',
      },
    ],
  },
  // Shown in its own "Watch Our Classroom Experience" homepage section
  // (pulled out of the hero slider so it isn't buried in a carousel).
  youtubeUrl: { type: String, default: 'https://www.youtube.com/embed/faFU7LFPtrw' },
  // Shown once sitewide (Home page) instead of repeating on every course -
  // the per-course Course.batchTimings.{online,offline} fields are
  // unaffected and stay the source of truth for the purchase modal.
  batchTimings: {
    onlineWeekday: {
      type: [String],
      default: ['9:00 AM - 11:00 AM', '11:00 AM - 1:00 PM', '1:00 PM - 3:00 PM', '9:00 PM - 10:30 PM'],
    },
    onlineWeekend: {
      type: [String],
      default: ['9:00 AM - 12:00 PM', '12:00 PM - 3:00 PM'],
    },
    offlineWeekday: {
      type: [String],
      default: ['3:00 PM - 5:00 PM', '4:00 PM - 6:00 PM', '5:00 PM - 7:00 PM', '6:00 PM - 8:00 PM', '7:00 PM - 9:00 PM'],
    },
    offlineWeekend: {
      type: [String],
      default: ['3:00 PM - 6:00 PM', '6:00 PM - 9:00 PM'],
    },
  },
  stats: {
    studentsCount: { type: Number, default: 10000 },
    yearsExperience: { type: Number, default: 15 },
    successRate: { type: Number, default: 100 },
    // 0 = auto (count the active courses in the Course collection). Set a
    // non-zero value here to override the Home page "Specialized Courses"
    // stat with a manually chosen number instead.
    coursesCount: { type: Number, default: 0 },
  },
});

module.exports = mongoose.model('SiteContent', SiteContentSchema);
