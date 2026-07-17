const mongoose = require('mongoose');

// Stores Contact-page and Counselling-page form submissions.
const ContactLeadSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['contact', 'counselling'], required: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: '' },
    courseType: { type: String, enum: ['online', 'offline', ''], default: '' },
    message: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactLead', ContactLeadSchema);
