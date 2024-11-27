const express = require('express');
const { startInterview, askQuestion, endInterview } = require('../controllers/interviewController');

const router = express.Router();

router.post('/start', startInterview);
router.post('/ask', askQuestion);
router.post('/end', endInterview);

module.exports = router;
