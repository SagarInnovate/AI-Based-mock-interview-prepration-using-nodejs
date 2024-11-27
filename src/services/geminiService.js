const { Gemini } = require('@google-cloud/genai');

const client = new Gemini({
  keyFilename: process.env.GEMINI_API_KEY,
});

async function generateQuestion(prompt) {
  try {
    const response = await client.generate({ prompt });
    return response.text;
  } catch (error) {
    console.error('Error generating question:', error);
    throw error;
  }
}

module.exports = { generateQuestion };
