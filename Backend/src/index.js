// Load environment variables first
require('dotenv').config({ path: './.env' });

const express = require('express');
const cors = require('cors');
const quizRoutes = require('./routes/quizRoutes');
const authRoutes = require('./routes/authRoutes');
const app = express();
const PORT = process.env.PORT || 3001; // Use environment variable or default to 3001

// Ensure API key is available
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('OPENAI_API_KEY environment variable is required');
  console.error('Please set OPENAI_API_KEY in your .env file');
  process.exit(1);
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5176'], // Allow both Vite dev servers
  credentials: true
}));
app.use(express.json());

// Sample route
app.get('/', (req, res) => {
  res.send('Welcome to the EduAI Backend API!');
});

// API Routes
app.use('/api/quiz', quizRoutes);
app.use('/api/auth', authRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log('Using OpenAI API key:', apiKey.substring(0, 10) + '...'); // Log first 10 chars for security
});
