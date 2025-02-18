const QuestionAnswer = require('../models/questionAnswerModel');
const Space = require('../models/spaceModel');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Start Interview Round
exports.startRound = async (req, res) => {
    try {
        const { spaceId, roundName } = req.params;
        const space = await Space.findById(spaceId);

        if (!space) {
            return res.status(404).send('Space not found');
        }

        // Get API key from session
        const apiKey = req.session.geminiApiKey;
        if (!apiKey) {
            return res.status(400).json({ error: 'No API key found. Please set your Gemini API key.' });
        }

        // Initialize Google Generative AI client
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        Based on the following details:
        - Job Role: ${space.jobPosition}
        - Company: ${space.companyName}
        - Job Description: ${space.jobDescription}
        - Resume Summary: ${space.purifiedSummary}
        - Interview Round: ${roundName}
        
        Generate **exactly 1-2 personalized interview questions** for this round, considering human psychology. Structure the questions as follows:
        1. Start with 2-3 warm-up questions.
        2. Ask 8-10 role-specific and challenging questions.
        3. End with 2-3 reflective or open-ended questions.

        Format the response as:
        1. [Question 1]
        2. [Question 2]
        ...
        16. [Question 16]
        `;

        try {
            const result = await model.generateContent(prompt);
            const questions = result.response.text()
                .split('\n')
                .filter(q => /^\d+\.\s/.test(q.trim())); 

            // console.log(questions);
            res.json({ questions });
        } catch (err) {
            console.error('Error generating questions:', err);
            res.status(500).send('Error generating interview questions.');
        }
    } catch (err) {
        console.error('Error starting round:', err);
        res.status(500).send('Error starting round.');
    }
};

// Finish Interview Round
exports.finishRound = async (req, res) => {
    try {
        const { spaceId, roundName } = req.params;
        const { answers } = req.body;

        const apiKey = req.session.geminiApiKey;
        if (!apiKey) {
            return res.status(400).json({ error: 'No API key found. Please set your Gemini API key.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const questionsAndAnswers = Object.entries(answers).map(([question, answer]) => ({
            spaceId,
            roundName,
            question,
            answer,
        }));

        await QuestionAnswer.insertMany(questionsAndAnswers);

        // Generate summary
        const prompt = `
        Summarize the interview round based on these questions and answers:
        ${Object.entries(answers).map(([q, a]) => `Q: ${q}\nA: ${a}\n`).join('')}

        Provide a clear evaluation and key takeaways.
        `;
        
        const result = await model.generateContent(prompt);
        const summary = result.response.text();

        // Save the summary to the database
        const space = await Space.findById(spaceId);
        const round = space.interviewRounds.find((r) => r.name === roundName);
        round.summary = summary;
        round.status = 'completed';

        await space.save();
        res.status(200).send('Round completed and summary generated.');
    } catch (err) {
        console.error('Error finishing round:', err);
        res.status(500).send('Error finishing round.');
    }
};

// Generate Follow-up Questions
exports.generateFollowUpQuestions = async (req, res) => {
    try {
        const { questionId } = req.params;
        const questionAnswer = await QuestionAnswer.findById(questionId);

        if (!questionAnswer) {
            return res.status(404).send('Question not found');
        }

        const apiKey = req.session.geminiApiKey;
        if (!apiKey) {
            return res.status(400).json({ error: 'No API key found. Please set your Gemini API key.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        Original Question: "${questionAnswer.question}"
        Student's Answer: "${questionAnswer.answer}"

        Job Role: "${questionAnswer.spaceId.jobPosition}"
        Company: "${questionAnswer.spaceId.companyName}"
        Interview Round: "${questionAnswer.roundName}"

        Based on the student's answer, generate a follow-up question that explores their response in more detail.
        `;

        const result = await model.generateContent(prompt);
        const followUpQuestion = result.response.text().trim();

        // Save the follow-up question
        await QuestionAnswer.create({
            spaceId: questionAnswer.spaceId,
            roundName: questionAnswer.roundName,
            question: followUpQuestion,
            isFollowUp: true,
        });

        res.status(200).send('Follow-up question generated and saved successfully.');
    } catch (err) {
        console.error('Error generating follow-up question:', err);
        res.status(500).send('Error generating follow-up question.');
    }
};
