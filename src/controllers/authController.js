const Student = require('../models/studentModel');

// Render the signup page
const signupView = (req, res) => {
  res.render('student/auth/signup', { error: null });
};

// Handle signup logic
const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await Student.findOne({ email });
    if (existingUser) {
      return res.render('student/auth/signup', { error: 'User with this email already exists.' });
    }

    // Create a new student
    const student = await Student.create({ name, email, password });

    // Redirect to the login page after successful signup
    res.redirect('/student/login');
  } catch (error) {
    console.error(error.message);
    res.status(500).render('student/auth/signup', { error: 'Server error. Please try again later.' });
  }
};

// Render the login page
const loginView = (req, res) => {
  res.render('student/auth/login', { error: null });
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
      res.redirect('/student/dashboard');
    } else {
      // Render login page with error if email or password is invalid
      res.status(401).render('student/auth/login', { error: 'Invalid email or password.' });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).render('student/auth/login', { error: 'Server error. Please try again later.' });
  }
};

module.exports = { signupView, signup, loginView, login };
