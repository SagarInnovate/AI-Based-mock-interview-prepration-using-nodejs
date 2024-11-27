const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const studentRoutes = require('./routes/studentRoutes');  
const homeRoutes = require('./routes/homeRoutes'); 

const app = express();

const session = require('express-session');

app.use(
  session({
    secret: 'f3e2db3f8f4544f9c9b9ac8c3d5f72e02c4d5986d15abbdc6c3e7fd3e5c0e10b', 
    resave: false, // Don't save session if nothing has changed
    saveUninitialized: false, // Don't create empty sessions
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Secure cookies in production
      httpOnly: true, // Prevent access by JavaScript
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);

// Middleware to parse JSON and form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Set views directory (views are inside the 'src/views' folder)
app.set('views', path.join(__dirname, 'views')); // Correct the path to 'views' here
app.set('view engine', 'ejs'); // Use EJS as the templating engine

// Serve static files from the 'public' directory (CSS, JS, images)
app.use(express.static(path.join(__dirname, '../public')));  // Correct the path to 'public' here

// Define routes for the app
app.use('/student', studentRoutes); 
app.use('/', homeRoutes); 

module.exports = app;
