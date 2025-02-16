const Space = require('../models/spaceModel');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const marked = require('marked'); 
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom'); 

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
const purifyContent = async (resumeText, jobDescription, apiKey) => {
  let prompt;
  if (jobDescription && jobDescription.trim().length > 20) {
      prompt = `
      I have the following resume text:
      "${resumeText}"

      And this job description:
      "${jobDescription}"

      Summarize the most relevant skills, experiences, and qualifications from the resume that match the job description. Only include essential and actionable points. Avoid ambiguity.
      `;
  } else {
      prompt = `
      I have the following resume text:
      "${resumeText}"

      Please summarize the most relevant skills, experiences, and qualifications from the resume, focusing on general strengths and achievements. Avoid ambiguity.
      `;
  }

  try {
      if (!apiKey) throw new Error('API key is missing.');

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      const result = await model.generateContent(prompt);
      return result.response.text(); 
  } catch (error) {
      console.error('Error summarizing content:', error);

      // Check if the error is due to an invalid API key
      if (error.message.includes('403') || error.message.includes('invalid') || error.message.includes('API key')) {
        req.flash('error', 'Invalid API key. Please create a new account with a correct API key.');
        res.redirect('/dashboard');
      }

    

      return 'Error generating summary'; 
  }
};


// Create a new interview space
exports.createSpace = async (req, res) => {
    try {
        const { companyName, jobPosition, interviewRounds, jobDescription } = req.body;
        const rounds = Array.isArray(interviewRounds) ? interviewRounds : [];
        const resumePath = req.file ? req.file.path : '';
        const fileName = req.file ? req.file.filename : '';

        const apiKey = req.session.geminiApiKey;
        if (!apiKey) {
          req.flash('error', 'No API key found. Please set your Gemini API key.');
          return res.redirect('/dashboard');
      }
      
      if (!companyName || !jobPosition || rounds.length === 0 || !resumePath) {
          req.flash('error', 'Company name, job position, interview rounds, and resume are required.');
          return res.redirect('/dashboard');
      }
      
      let resumeText = '';
      if (resumePath.endsWith('.pdf')) {
          resumeText = await extractTextFromPDF(resumePath);
      } else if (resumePath.endsWith('.docx')) {
          resumeText = await extractTextFromDOCX(resumePath);
      } else {
          req.flash('error', 'Only PDF and DOCX file types are supported.');
          return res.redirect('/dashboard');
      }
      
        const isJobDescriptionValid = jobDescription && jobDescription.trim().length > 20;
        const purifiedSummary = await purifyContent(resumeText, isJobDescriptionValid ? jobDescription : '', apiKey);

        const newSpace = new Space({
            studentId: req.session.studentId,
            companyName,
            jobPosition,
            interviewRounds: rounds.map((round) => ({ name: round })),
            jobDescription: isJobDescriptionValid ? jobDescription : 'N/A',
            resumePath: fileName,
            resumeText,
            purifiedSummary,
        });

        await newSpace.save();
        req.flash('success', 'Space created successfully!');
        res.redirect('/dashboard');
    } catch (err) {
        console.error('Error creating space:', err);
        req.flash('error', 'Error creating space. Please try again.');
        res.redirect('/dashboard');
    }
};


// Fetch all spaces for a student
exports.getSpaces = async (req, res) => {
  try {
    const spaces = await Space.find({ studentId: req.session.studentId });

    res.render('student/dashboard', { 
      spaces, 
      layout: 'layouts/d-main', 
      success: req.flash('success'), 
      error: req.flash('error') 
    });
  } catch (err) {
    console.error('Error fetching spaces:', err);
    req.flash('error', 'Error fetching spaces. Please try again.');
    res.redirect('/dashboard'); // Redirect with flash error message
  }
};



exports.getSpaceDetails = async (req, res) => {   
  try {     
    const { id } = req.params;
    
    // Fetch the space with populated data
    const space = await Space.findById(id);      

    if (!space) {
      req.flash('error', 'Space not found.');
      return res.redirect('/dashboard');
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
    try {
      res.render('student/space-details', {
        space,
        layout: 'layouts/d-main'
      });
  } catch (err) {
      console.error('Error fetching space details:', err);
      req.flash('error', 'Error fetching space details. Please try again.');
      res.redirect('/dashboard'); // Redirect with error message
  }
  
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



