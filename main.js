const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const prompt = "tell me about chatrapti shivaji maharaj";

const startGenerating=async()=>{
try {
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
} catch (error) {
    console.log(error);
}
}

startGenerating();