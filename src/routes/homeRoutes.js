const express = require('express');
const houseController = require('../controllers/homeController');
const studentController = require('../controllers/studentController');
const authController = require('../controllers/authController');
const multer = require('multer');
const spaceController = require('../controllers/spaceController');
const path = require('path');
const router = express.Router();
const fs = require('fs');

// Protect middleware
const protect = (req, res, next) => {
  if (!req.session.studentId) {
    return res.redirect('/login'); // Redirect unauthenticated users
  }
  next();
};

// Redirect if authenticated middleware
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session.studentId) {
    return res.redirect('/dashboard'); // Redirect authenticated users
  }
  next();
};

// Ensure 'Resumes' folder exists
const resumeFolderPath = path.join(__dirname, '../../public/Resumes');
if (!fs.existsSync(resumeFolderPath)) {
  fs.mkdirSync(resumeFolderPath, { recursive: true });
}

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log(`Storing file in: ${resumeFolderPath}`);
    cb(null, resumeFolderPath); // Set the destination to the 'Resumes' folder
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    console.log(`Saving file as: ${uniqueName}`);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// Home routes
router.get('/', houseController.home);
router.get('/about', houseController.about);
router.get('/contact', houseController.contact);

// Auth routes
router.get('/signup', redirectIfAuthenticated, authController.signupView);
router.post('/signup', authController.signup);
router.get('/login', redirectIfAuthenticated, authController.loginView);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPasswordForm);
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).send('Unable to logout');
    }
    res.redirect('/login'); // Redirect to login after logout
  });
});

// Protected student routes
router.get('/dashboard', protect, spaceController.getSpaces);
router.get('/profile', protect, studentController.getProfile);
router.post('/update-profile', protect, studentController.updateProfile);
router.get('/change-password', protect, studentController.changePasswordView);
router.post('/change-password', protect, studentController.changePassword);

// Space routes
router.get('/spaces', protect, (req, res) => {
  res.redirect('/dashboard'); // Redirect to dashboard
});
router.post('/spaces/create', [protect, upload.single('resume')], spaceController.createSpace);
router.post('/spaces/start-round/:spaceId/:roundName', protect, spaceController.startRound);

module.exports = router;
