require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');

const contactRoutes  = require('./routes/contact');
const orderRoutes    = require('./routes/orders');
const webhookRoutes  = require('./routes/webhook');
const adminRoutes    = require('./routes/admin');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── SECURITY HEADERS
app.use(helmet());

// ── CORS — only allow your frontend
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'http://localhost:5500',   // local dev
    'http://127.0.0.1:5500'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-secret']
}));

// ── RATE LIMITING
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: { error: 'Too many requests. Please try again later.' }
});
app.use('/api/', limiter);

// ── BODY PARSER
// Webhook needs raw body for Razorpay signature verification
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── HEALTH CHECK
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AlgoEdge Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ── ROUTES
app.use('/api/contact',  contactRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/webhook',  webhookRoutes);
app.use('/api/admin',    adminRoutes);

// ── 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

// ── START
app.listen(PORT, () => {
  console.log(`\n✅ AlgoEdge Backend running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/`);
  console.log(`   Env: ${process.env.NODE_ENV || 'development'}\n`);
});
