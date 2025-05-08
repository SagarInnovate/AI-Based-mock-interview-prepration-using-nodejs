const Space = require('../models/spaceModel');
const Session = require('../models/sessionModel');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const marked = require('marked'); 
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom'); 

// Global API key
const API_KEY = process.env.GEMINI_API_KEY;

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

// Function to generate a purified summary using Gemini AI
const purifyContent = async (resumeText, jobDescription) => {
  let prompt;
  if (jobDescription && jobDescription.trim().length > 20) {
    console.log("running inside description");
      prompt = `
      I have the following resume text:
      "${resumeText}"

      And this job description:
      "${jobDescription}"

      Summarize the most relevant skills, experiences, and qualifications from the resume that match the job description. Only include essential and actionable points. Avoid ambiguity.
      `;
  } else {
    console.log("running inside without description");
      prompt = `
      I have the following resume text:
      "${resumeText}"

      Please summarize the most relevant skills, experiences, and qualifications from the resume, focusing on general strengths and achievements. Avoid ambiguity.
      `;
  }

  try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      return result.response.text(); 
  } catch (error) {
      console.error('Error summarizing content:', error);
      return 'Error generating summary'; 
  }
};

// Create a new interview space
exports.createSpace = async (req, res) => {
  console.log('Creating space...');
  console.log('Request body:', req.body);
  try {
    const { companyName, jobPosition, interviewRounds, jobDescription } = req.body;
    
    // Fix for single round selection - ensure it's always an array
    const rounds = Array.isArray(interviewRounds) 
      ? interviewRounds 
      : interviewRounds ? [interviewRounds] : [];
      
    const resumePath = req.file ? req.file.path : '';
    const fileName = req.file ? req.file.filename : '';
  
    if (!companyName || !jobPosition || rounds.length === 0 || !resumePath) {
      return res.status(400).send('Company name, job position, interview rounds, and resume are required.');
    }
      
        let resumeText = '';
        if (resumePath.endsWith('.pdf')) {
            resumeText = await extractTextFromPDF(resumePath);
        } else if (resumePath.endsWith('.docx')) {
            resumeText = await extractTextFromDOCX(resumePath);
        } else {
            return res.status(400).send('Only PDF and DOCX file types are supported.');
        }
      
        const isJobDescriptionValid = jobDescription && jobDescription.trim().length > 20;
        const purifiedSummary = await purifyContent(resumeText, isJobDescriptionValid ? jobDescription : '');

        const newSpace = new Space({
            studentId: req.session.uniqueId, // Use uniqueId instead of studentId
            companyName,
            jobPosition,
            interviewRounds: rounds.map((round) => ({ name: round })),
            jobDescription: isJobDescriptionValid ? jobDescription : 'N/A',
            resumePath: fileName,
            resumeText,
            purifiedSummary,
        });

        await newSpace.save();
        
        // Update session's spaces array
        await Session.findOneAndUpdate(
            { uniqueId: req.session.uniqueId },
            { $push: { spaces: newSpace._id } }
        );
        
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Error creating space:', err);
        res.status(500).send('Error creating space. Please try again.');
    }
};

// Fetch all spaces for a session
exports.getSpaces = async (req, res) => {
    try {
      const spaces = await Space.find({ studentId: req.session.uniqueId });
      const session = await Session.findOne({ uniqueId: req.session.uniqueId });
  
      res.render('student/dashboard', { 
        spaces, 
        session,
        name: session ? session.name : 'User',
        uniqueId: req.session.uniqueId // Added uniqueId here
      });
    } catch (err) {
      console.error('Error fetching spaces:', err);
      res.status(500).send('Error fetching spaces. Please try again.');
    }
  };

// Get space details
exports.getSpaceDetails = async (req, res) => {   
  try {     
    const { id } = req.params;
    
    // Fetch the space with populated data
    const space = await Space.findById(id);      

    if (!space) {
      return res.status(404).send('Space not found.');
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
      name: req.session.name || 'User'
    });
   
  } catch (err) {
    console.error('Error fetching space details:', err);
    res.status(500).send('Error fetching space details. Please try again.');
  } 
};

// Download resume
exports.downloadResume = (req, res) => {
  try {
    const filePath = path.resolve(path.join(__dirname, '../../public/Resumes', req.params.filePath));
    
    // Security check to prevent directory traversal
    if (!filePath.startsWith(path.resolve(path.join(__dirname, '../../public/Resumes')))) {
      return res.status(403).send('Access denied');
    }
    
    res.download(filePath, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        res.status(500).send('Error downloading file');
      }
    });
  } catch (err) {
    console.error('Error in download route:', err);
    res.status(500).send('Error processing download request');
  }
};

// Start interview round
exports.startInterviewRound = async (req, res) => {
  try {
    const { id, roundName } = req.params;
    const space = await Space.findById(id);

    if (!space) {
      return res.status(404).send('Space not found');
    }

    const round = space.interviewRounds.find(r => r.name === roundName);
    if (!round) {
      return res.status(404).send('Round not found');
    }

    // Mark round as in progress
    round.status = 'in_progress';
    await space.save();

    res.redirect(`/space/${id}/round/${roundName}/start`);
  } catch (err) {
    console.error('Error starting interview round:', err);
    res.status(500).send('Error starting interview round');
  }
};