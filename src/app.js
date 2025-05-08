// app.js
const express = require('express');
const path = require('path');
const session = require('cookie-session');
const rateLimit = require('express-rate-limit');
require('dotenv').config(); // Load environment variables

// Import routes
const routes = require('./routes');

const app = express();

// Configure rate limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests, please try again later' },
  skip: (req) => req.session && req.session.admin === true // Skip for admins
});

const createSpaceLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 space creations per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'You have created too many spaces. Please try again later.' },
  keyGenerator: (req) => req.session.uniqueId || req.ip // Use session ID if available
});

const interviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 interview actions per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Interview limit reached. Please try again later.' },
  keyGenerator: (req) => req.session.uniqueId || req.ip
});

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'interviewAppSecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set views directory and view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Apply rate limiting to specific routes
app.use('/api/', apiLimiter);
app.use('/spaces/create', createSpaceLimiter);
app.use(['/generate-questions', '/finish-round'], interviewLimiter);

// Routes
app.use('/', routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).render('404', { title: '404 - Page Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  
  // Handle rate limit errors
  if (err.statusCode === 429) {
    return res.status(429).render('error', {
      title: 'Too Many Requests',
      message: 'You have exceeded the request limit. Please try again later.'
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).render('error', {
      title: 'Invalid Input',
      message: err.message
    });
  }
  
  // Handle file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).send('File size exceeds the maximum limit (10MB)');
  }
  
  // Default error response
  res.status(500).render('error', {
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again later.'
  });
});

module.exports = app;