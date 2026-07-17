const mongoose = require('mongoose');

// Every photo shown in the site-wide Gallery is a document in this
// collection - add, edit, reorder, or remove photos via the /api/gallery
// admin routes (x-admin-key header) or directly in the database. The
// frontend always renders whatever is in this collection, so photos are
// fully database-managed with no code changes needed.
const GallerySchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    // Required for photos; for videos it's an optional poster/thumbnail shown
    // in the grid (falls back to a plain video placeholder if left blank).
    imageUrl: {
      type: String,
      required: function () {
        return this.mediaType !== 'video';
      },
      default: '',
    },
    // Only used when mediaType === 'video' - a YouTube embed URL
    // (https://www.youtube.com/embed/VIDEO_ID) or a direct .mp4 file URL.
    videoUrl: {
      type: String,
      required: function () {
        return this.mediaType === 'video';
      },
      default: '',
    },
    category: {
      type: String,
      enum: ['classroom', 'event', 'student', 'certificate', 'other'],
      default: 'classroom',
    },
    courseSlug: { type: String, default: '' }, // optional: tie a photo to a specific course
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Gallery', GallerySchema);
