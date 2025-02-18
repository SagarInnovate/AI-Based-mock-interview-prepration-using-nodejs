const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('cookie-session');
require('dotenv').config(); // Load environment variables
const flash = require('connect-flash');


// Import routes
const homeRoutes = require('./routes/homeRoutes'); 

const app = express();

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'defaultSecret', // Use environment variable for session secret
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Secure cookies in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

app.use(flash());

// Middleware to pass flash messages to templates
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});


// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set views directory and view engine
app.set('views', path.join(__dirname, 'views')); 
app.set('view engine', 'ejs'); 

// Express-EJS-Layouts setup
app.use(expressLayouts);
app.set('layout', 'layouts/main'); 

// Serve static files
app.use(express.static(path.join(__dirname, '../public'))); 


app.use('/', homeRoutes); 

// 404 Handler
app.use((req, res) => {
  res.status(404).render('pages/404', { layout: 'layouts/f-main', title: '404 - Page Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

module.exports = app;
