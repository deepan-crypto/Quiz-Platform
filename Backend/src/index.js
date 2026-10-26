// Load environment variables first
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const quizRoutes = require('./routes/quizRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Log OpenAI API key status on boot
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey || apiKey === 'your_openai_api_key_here') {
  console.warn('⚠️  WARNING: OPENAI_API_KEY is not configured in .env. AI quiz generation will be disabled until set.');
} else {
  console.log('✅ OpenAI API key loaded:', apiKey.substring(0, 7) + '...');
}

// Allowed CORS origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:3000',
  'http://localhost:4173',
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(s => s.trim()) : []),
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(s => s.trim()) : [])
].filter(Boolean);

// CORS configuration for local development and cloud deployment
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server)
    if (!origin) return callback(null, true);

    // If wildcard or in allowed list
    if (
      process.env.CLIENT_URL === '*' ||
      process.env.FRONTEND_URL === '*' ||
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }

    // Default allow to ensure deployed frontend can communicate
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json());

// Health check endpoint (for deployment platforms like Render, Railway, AWS, Fly.io)
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let dbError = null;
  try {
    const { getDb } = require('./db');
    const db = await getDb();
    await db.command({ ping: 1 });
    dbStatus = 'connected';
  } catch (err) {
    dbError = err.message;
  }

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      isConfigured: !!process.env.MONGODB_URI && !process.env.MONGODB_URI.includes('localhost') && !process.env.MONGODB_URI.includes('127.0.0.1'),
      error: dbError
    }
  });
});

// Root welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the EduAI Backend API!',
    status: 'running',
    endpoints: {
      health: '/health',
      quiz: '/api/quiz',
      auth: '/api/auth'
    }
  });
});

// API Routes
app.use('/api/quiz', quizRoutes);
app.use('/api/auth', authRoutes);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 EduAI Server is running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});
