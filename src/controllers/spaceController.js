const Space = require('../models/spaceModel');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
require('dotenv').config();
const marked = require('marked'); // Add markdown parsing
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom'); // For server-side HTML sanitization


const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


// Function to extract text from PDF
const extractTextFromPDF = async (filePath) => {
  const pdfBuffer = await fs.promises.readFile(filePath);
  const data = await pdfParse(pdfBuffer);
  return data.text;
};

// Function to extract text from DOCX
const extractTextFromDOCX = async (filePath) => {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
};

const purifyContent = async (resumeText, jobDescription = '') => {
  let prompt;

  if (jobDescription && jobDescription.trim().length > 20) {
    // Use both resume and job description for summarization
    prompt = `
    I have the following resume text:
    "${resumeText}"
    
    And this job description:
    "${jobDescription}"
    
    Summarize the most relevant skills, experiences, and qualifications from the resume that match the job description. Only include essential and actionable points. Avoid ambiguity.
    `;
  } else {
    // Use only the resume for summarization
    prompt = `
    I have the following resume text:
    "${resumeText}"
    
  Please summarize the most relevant skills, experiences, and qualifications from the resume, focusing on general strengths and achievements. Avoid ambiguity.
    `;
  }

  try {
    const result = await model.generateContent(prompt);
    return result.response.text(); // Return purified summary
  } catch (error) {
    console.error('Error summarizing content:', error);
    return 'Error generating summary'; // Fallback message
  }
};


exports.createSpace = async (req, res) => {
  try {
    const { companyName, jobPosition, interviewRounds, jobDescription } = req.body;
    const rounds = Array.isArray(interviewRounds) ? interviewRounds : [];
    const resumePath = req.file ? req.file.path : '';
    const fileName= req.file ? req.file.filename : '';
    
console.log(req.file);
    // Validate input fields
    if (!companyName || !jobPosition || rounds.length === 0 || !resumePath) {
      return res.redirect(`/dashboard?error=${encodeURIComponent('Company name, job position, interview rounds, and resume are required.')}`);
    }

    // Extract text from resume
    let resumeText = '';
    if (resumePath.endsWith('.pdf')) {
      resumeText = await extractTextFromPDF(resumePath);
    } else if (resumePath.endsWith('.docx')) {
      resumeText = await extractTextFromDOCX(resumePath);
    } else {
      return res.redirect(`/dashboard?error=${encodeURIComponent('Only PDF and DOCX file types are supported.')}`);
    }

    // Check if job description is valid
    const isJobDescriptionValid = jobDescription && jobDescription.trim().length > 20;

    // Purify and summarize the resume (with or without job description)
    const purifiedSummary = await purifyContent(resumeText, isJobDescriptionValid ? jobDescription : '');

    // Create a new Space entry
    const newSpace = new Space({
      studentId: req.session.studentId,
      companyName,
      jobPosition,
      interviewRounds: rounds.map((round) => ({ name: round })),
      jobDescription: isJobDescriptionValid ? jobDescription : 'N/A', // Save only valid descriptions
      resumePath: fileName,
      resumeText, // Store the full extracted text
      purifiedSummary, // Store the purified summary
    });

    // Save to database
    await newSpace.save();

    // Redirect to dashboard on success
    res.redirect('/dashboard');
  } catch (err) {
    console.error('Error creating space:', err);
    res.redirect(`/dashboard?error=${encodeURIComponent('Error creating space. Please try again.')}`);
  }
};




// Fetch all spaces for a student
exports.getSpaces = async (req, res) => {
  try {
    const spaces = await Space.find({ studentId: req.session.studentId });
    res.render('student/dashboard', { spaces, layout: 'layouts/d-main' });
  } catch (err) {
    console.error('Error fetching spaces:', err);
    res.status(500).send('Error fetching spaces');
  }
};


exports.getSpaceDetails = async (req, res) => {   
  try {     
    const { id } = req.params;
    
    // Fetch the space with populated data
    const space = await Space.findById(id);      

    if (!space) {
      return res.redirect(`/dashboard?error=${encodeURIComponent('Space not found.')}`);
    }

    // Set up DOMPurify for server-side sanitization
    const window = new JSDOM('').window;
    const DOMPurify = createDOMPurify(window);

    // Sanitize and parse markdown for different fields
    if (space.jobDescription) {
      space.jobDescription = DOMPurify.sanitize(marked.parse(space.jobDescription));
    }

    if (space.purifiedSummary) {
      space.purifiedSummary = DOMPurify.sanitize(marked.parse(space.purifiedSummary));
    }

    // Process interview rounds
    if (space.interviewRounds && space.interviewRounds.length > 0) {
      space.interviewRounds = space.interviewRounds.map(round => {
        // Only process summary if it exists and the round is not 'not completed'
        if (round.summary && round.status !== 'not completed') {
          // Convert summary to HTML and sanitize
          round.summaryHTML = DOMPurify.sanitize(marked.parse(round.summary));
        }
        return round;
      });
    }
     
    res.render('student/space-details', {
      space,
      layout: 'layouts/d-main'
    });
   
  } catch (err) {
    console.error('Error fetching space details:', err);
    res.status(500).send('Error fetching space details');
  } 
};


exports.downloadResume = (req, res) => {
  const filePath = path.resolve(req.params.filePath); // Assuming secure paths
  res.download(filePath, (err) => {
    if (err) {
      console.error('Error downloading file:', err);
      res.status(500).send('Error downloading file');
    }
  });
};


exports.startInterviewRound = async (req, res) => {
  try {
    const { id, roundName } = req.params;
    const space = await Space.findById(id);

    const round = space.interviewRounds.find(r => r.name === roundName);
    if (!round) {
      return res.status(404).send('Round not found');
    }

    round.status = 'completed';
    round.summary = 'Summary generated after interview'; // Replace with actual logic
    await space.save();

    res.redirect(`/space/${id}`);
  } catch (err) {
    console.error('Error starting interview round:', err);
    res.status(500).send('Error starting interview round');
  }
};



