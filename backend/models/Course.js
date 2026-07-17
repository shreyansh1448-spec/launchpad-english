const mongoose = require('mongoose');

const SyllabusModuleSchema = new mongoose.Schema(
  {
    module: { type: String, required: true },
    points: [{ type: String }],
  },
  { _id: false }
);

const FaqSchema = new mongoose.Schema(
  {
    q: { type: String, required: true },
    a: { type: String, required: true },
  },
  { _id: false }
);

const PriceSchema = new mongoose.Schema(
  {
    mrp: { type: Number, required: true }, // original / cut price (shown with strikethrough)
    offer: { type: Number, required: true }, // final selling price
  },
  { _id: false }
);

const ImageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    caption: { type: String, default: '' },
  },
  { _id: false }
);

const ResourceSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g. "Brochure", "Sample Notes", "Syllabus PDF"
  url: { type: String, required: true }, // served from /uploads/resources/:slug/...
});

// This is the "database" course pricing and content live in. Changing
// mrp/offer (or any other field) here - via the admin API (PUT
// /api/courses/:slug with x-admin-key header), a DB console, or the seed
// script - automatically updates the price and content everywhere on the
// site. No frontend code changes or redeploy needed.
const CourseSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    tagline: { type: String, required: true },
    duration: { type: String, required: true },
    level: { type: String, default: 'All Levels' },
    overview: { type: String, required: true },
    highlights: [{ type: String }],
    whoShouldJoin: [{ type: String }],
    syllabus: [SyllabusModuleSchema],
    dailyPattern: [{ type: String }],
    outcomes: [{ type: String }],
    batchTimings: {
      online: [{ type: String }],
      offline: [{ type: String }],
    },
    faqs: [FaqSchema],
    images: [ImageSchema],
    thumbnail: { type: String, default: '' },
    resources: [ResourceSchema], // admin-uploaded PDFs (brochure, syllabus, worksheets, etc.)
    pricing: {
      online: { type: PriceSchema, required: true },
      offline: { type: PriceSchema, required: true },
    },
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    featured: { type: Boolean, default: true }, // shown in the Home page course grid when true
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', CourseSchema);
