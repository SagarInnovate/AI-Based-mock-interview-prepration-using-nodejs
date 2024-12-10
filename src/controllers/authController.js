const Student = require('../models/studentModel');
const crypto = require('crypto');
const transporter = require('../config/email');

// Render the signup page
const signupView = (req, res) => {
  res.render('student/auth/signup', { title: 'Signup', error: null });
};

// Handle signup logic

const signup = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate the email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.render('student/auth/signup', {
        title: 'Signup',
        error: 'Invalid email format. Please enter a valid email.',
      });
    }

    // Check if the user already exists
    const existingUser = await Student.findOne({ email });
    if (existingUser) {
      return res.render('student/auth/signup', {
        title: 'Signup',
        error: 'User with this email already exists.',
      });
    }

    // Generate an 8-character random alphanumeric password
    const generatedPassword = crypto.randomBytes(4).toString('hex');

    // Create a new student
    const student = await Student.create({
      name: 'User', // Default name
      email,
      password: generatedPassword,
    });

    // Render the email template as HTML
    const emailContent = await new Promise((resolve, reject) => {
      res.render(
        'email/welcome',
        { 
          email, 
          password: generatedPassword, 
          title: 'Welcome to Our Platform',
          layout: false // Prevent loading the default layout
        },
        (err, html) => {
          if (err) return reject(err); // Reject the promise on error
          resolve(html); // Resolve the promise with the rendered HTML
        }
      );
    });
    

    // Send the email with login credentials
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: email,
      subject: 'Welcome to Our Platform - Your Login Credentials',
      html: emailContent,
    });

    // Redirect to the login page after successful signup
    res.redirect('/login');
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).render('student/auth/signup', {
      title: 'Signup',
      error: 'Server error. Please try again later.',
    });
  }
};

// Render the login page
const loginView = (req, res) => {
  res.render('student/auth/login', {title: 'Login', error: null });
};

// Handle login logic
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the student by email
    const student = await Student.findOne({ email });

    if (student && (await student.matchPassword(password))) {
      // Save the user's information in the session
      req.session.studentId = student._id;
      req.session.name = student.name;

      // Redirect to the dashboard after successful login
      res.redirect('/dashboard');
    } else {
      // Render login page with error if email or password is invalid
      res.status(401).render('student/auth/login', {title: 'Login', error: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).render('student/auth/login', { error: 'Server error. Please try again later.' });
  }
};

const forgotPasswordForm=async(req,res)=>{
  res.render('student/auth/forgot-password', { title: 'Forgot Password', error: null });
}

module.exports = { signupView, signup, loginView, login, forgotPasswordForm };
