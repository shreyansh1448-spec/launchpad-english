const mongoose = require('mongoose');

// The single admin account used to log into /admin. Replaces the old
// shared x-admin-key header - login now issues a JWT (see routes/adminAuth.js
// and middleware/adminAuth.js). resetTokenHash/resetTokenExpiry back the
// "Forgot password" flow (a fresh random token is hashed before storing, the
// same way passwords are, so a DB leak doesn't expose usable reset links).
const AdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    resetTokenHash: { type: String, default: '' },
    resetTokenExpiry: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', AdminSchema);
