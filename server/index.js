const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();

// ===== CORS CONFIGURATION =====
// Allow localhost for Live Server and local development
const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500', 'http://127.0.0.1:3000', 'http://localhost'];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-admin-token']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// ===== ADMIN CREDENTIALS (change in .env) =====
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'rohit';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Trailhive@2025';
const activeSessions = new Set();

function generateToken() { return crypto.randomBytes(32).toString('hex'); }

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'] || req.query.token;
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
  }
  next();
}

// ===== MONGODB =====
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trailhive';

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 })
  .then(() => console.log('✅ MongoDB connected:', MONGO_URI))
  .catch(err => {
    console.error('❌ MongoDB FAILED:', err.message);
    console.error('   Run: mongod   OR use MongoDB Atlas URI in .env');
  });

// ===== SCHEMA =====
const bookingSchema = new mongoose.Schema({
  bookingId:     { type: String, required: true, unique: true },
  firstName:     { type: String, required: true },
  lastName:      { type: String, required: true },
  name:          { type: String, required: true },
  email:         { type: String, required: true },
  phone:         { type: String, required: true },
  age:           { type: Number },
  address:       { type: String, required: true },
  trip:          { type: String, required: true },
  icon:          { type: String },
  perPerson:     { type: Number, required: true },
  travellers:    { type: Number, required: true, default: 1 },
  total:         { type: Number, required: true },
  notes:         { type: String, default: '' },
  paymentId:     { type: String, required: true },
  paymentStatus: { type: String, default: 'paid' },
  createdAt:     { type: Date, default: Date.now },
});
const Booking = mongoose.model('Booking', bookingSchema);

// ===== HEALTH CHECK ROUTES =====
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbConnected = dbStatus === 1; // 1 = connected, 0 = disconnected, 2 = connecting, 3 = disconnecting
  res.json({ 
    success: true, 
    server: 'running',
    database: dbConnected ? 'connected' : 'disconnected',
    dbState: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbStatus],
    mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/trailhive',
    adminUser: ADMIN_USERNAME
  });
});

app.get('/api/status', (req, res) => {
  res.json({ 
    server: 'Active ✅',
    port: process.env.PORT || 3000,
    db: mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Not Connected',
    adminEndpoint: '/admin-login.html',
    dashboardEndpoint: '/admin.html'
  });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/status.html'));
});
// ===== AUTH ROUTES =====
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = generateToken();
    activeSessions.add(token);
    setTimeout(() => activeSessions.delete(token), 8 * 60 * 60 * 1000);
    console.log('🔐 Admin logged in:', username);
    return res.json({ success: true, token });
  }
  console.warn('⚠️  Bad login attempt:', username);
  res.status(401).json({ success: false, message: 'Invalid username or password' });
});

app.post('/api/admin/logout', (req, res) => {
  const token = req.headers['x-admin-token'];
  if (token) activeSessions.delete(token);
  res.json({ success: true });
});

app.get('/api/admin/verify', requireAdmin, (req, res) => {
  res.json({ success: true });
});

// ===== PUBLIC ROUTE =====
app.post('/api/register', async (req, res) => {
  try {
    const data = req.body;
    if (!data.bookingId) data.bookingId = 'TH-' + Date.now().toString(36).toUpperCase();
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Database not connected' });
    }
    const booking = new Booking({
      bookingId: data.bookingId, firstName: data.firstName, lastName: data.lastName,
      name: data.name, email: data.email, phone: data.phone,
      age: parseInt(data.age)||0, address: data.address, trip: data.trip,
      icon: data.icon||'', perPerson: Number(data.perPerson),
      travellers: Number(data.travellers), total: Number(data.total),
      notes: data.notes||'', paymentId: data.paymentId,
      paymentStatus: data.paymentStatus||'paid', createdAt: new Date(),
    });
    await booking.save();
    console.log(`✅ Saved: ${booking.bookingId} | ${booking.name} | ${booking.trip} | Rs.${booking.total}`);
    res.status(201).json({ success: true, bookingId: booking.bookingId });
  } catch (err) {
    if (err.code === 11000) return res.json({ success: true, bookingId: req.body.bookingId });
    console.error('❌ Save error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===== PROTECTED ADMIN ROUTES =====
app.get('/api/bookings', requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, bookings });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/stats', requireAdmin, async (req, res) => {
  try {
    const total   = await Booking.countDocuments();
    const revenue = await Booking.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
    const trips   = await Booking.aggregate([{ $group: { _id: '$trip', count: { $sum: 1 } } }]);
    const today   = new Date(); today.setHours(0,0,0,0);
    const todayCount = await Booking.countDocuments({ createdAt: { $gte: today } });
    res.json({ success: true, totalBookings: total, totalRevenue: revenue[0]?.total||0, todayBookings: todayCount, bookingsByTrip: trips });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.delete('/api/bookings/:bookingId', requireAdmin, async (req, res) => {
  try {
    await Booking.deleteOne({ bookingId: req.params.bookingId });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 TrailHive: http://localhost:${PORT}`);
  console.log(`🔐 Admin login: http://localhost:${PORT}/admin-login.html`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin.html`);
  console.log(`\n👤 Username: ${ADMIN_USERNAME}  |  🔑 Password: ${ADMIN_PASSWORD}\n`);
});
