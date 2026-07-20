const mongoose = require('mongoose');
const dns = require('dns');

// Some local dev networks (WSL2/container DNS proxies in particular) can't
// resolve the mongodb+srv SRV record even though every other DNS query
// works fine - Node's resolver needs to hit a real DNS server for that
// specific query type. Pointing it at public DNS fixes local dev; skipped
// in production (Vercel) since it doesn't hit this and already resolves
// SRV records fine on its own network.
if (process.env.NODE_ENV !== 'production') {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}

async function connectDB() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/launchpad_english';
  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected:', uri);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.error('Is MongoDB running? Set MONGO_URI in backend/.env (see .env.example).');
    process.exit(1);
  }
}

module.exports = connectDB;
