const multer = require('multer');
const path = require('path');
const fs = require('fs');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads', 'gallery');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
    cb(null, UPLOAD_ROOT);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_ ]/g, '').slice(-100);
    cb(null, `${Date.now()}-${safeName}`);
  },
});

function fileFilter(req, file, cb) {
  if (!/^image\/|^video\//.test(file.mimetype)) {
    return cb(new Error('Only image or video files are allowed'));
  }
  cb(null, true);
}

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100mb - covers both photos and short videos
});
