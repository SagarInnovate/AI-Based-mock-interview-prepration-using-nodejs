const express = require('express');
const houseController = require('../controllers/homeController');
const studentController = require('../controllers/studentController');
const authController = require('../controllers/authController');
const multer = require('multer');
const spaceController = require('../controllers/spaceController');
const interviewController = require('../controllers/InterviewController');
const path = require('path');
const router = express.Router();
const fs = require('fs');
const Student = require('../models/studentModel');

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
    // console.log(`Storing file in: ${resumeFolderPath}`);
    cb(null, resumeFolderPath); // Set the destination to the 'Resumes' folder
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    // console.log(`Saving file as: ${uniqueName}`);
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
  req.session = null; // Clear the session
  res.redirect('/login'); // Redirect to login page
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

router.get('/space', protect, (req, res) => {
  res.redirect('/dashboard'); // Redirect to dashboard
});

router.post('/spaces/create', [protect, upload.single('resume')], spaceController.createSpace);
router.get('/space/:id',spaceController.getSpaceDetails);

// router.post('/spaces/start-round/:spaceId/:roundName', protect, spaceController.startRound);
router.get('/space/:spaceId/round/:roundName/start', (req, res) => {
  const { spaceId, roundName } = req.params;

  // Pass these variables to the view
  res.render('student/interview-screen', { layout:'layouts/d-main', spaceId, roundName });
});

// Route to start an interview round and generate questions
router.get('/generate-questions/:spaceId/:roundName', interviewController.startRound);

// Route to finish an interview round and save answers with summary
router.post('/finish-round/:spaceId/:roundName', interviewController.finishRound);

router.get('/get-api-key', async (req, res) => {
  try {
      if (!req.session.studentId) {
          return res.status(401).json({ error: 'Unauthorized' });
      }

      const student = await Student.findById(req.session.studentId);
      if (!student) {
          return res.status(404).json({ error: 'User not found' });
      }

      res.json({ geminiApiKey: student.geminiApiKey });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
  }
});

router.post('/save-api-key', async (req, res) => {
  try {
      if (!req.session.studentId) {
          return res.status(401).json({ error: 'Unauthorized' });
      }

      const { apiKey } = req.body;
      if (!apiKey) {
          return res.status(400).json({ error: 'API key is required.' });
      }

      await Student.findByIdAndUpdate(req.session.studentId, { geminiApiKey: apiKey });

      req.session.geminiApiKey = apiKey;  // Update session
      res.json({ success: true });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error:'});
  }
});


router.get('/test', houseController.test);

module.exports = router;
