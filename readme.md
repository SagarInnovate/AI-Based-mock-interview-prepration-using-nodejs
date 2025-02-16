# AI-Based Mock Interview Preparation System

## Overview
The **AI-Based Mock Interview Preparation System** is a state-of-the-art platform designed to help students and professionals prepare for technical interviews in a structured, realistic, and efficient manner. The system leverages **Bootstrap, Node.js, Express.js, and MongoDB** to provide a seamless and interactive experience. Advanced **AI capabilities** are utilized to generate industry-relevant interview questions based on the student’s resume, job description, and interview round type. The system also provides AI-generated interview feedback, evaluation reports, and improvement recommendations.

## Features
- **User Authentication**
  - Secure signup and login system.
  - User credentials are emailed via **Gmail SMTP**.
- **Interactive Dashboard**
  - Provides an intuitive interface for managing interview preparations.
- **Space Management (Company-wise Interviews)**
  - Users create a "Space" for each company they are preparing for.
  - Each space contains:
    - **Company Name**
    - **Job Description**
    - **Job Position**
    - **Interview Rounds** (Technical, HR, Aptitude, etc.)
    - **Resume Upload & AI Summarization**
- **AI-Powered Resume Summarization**
  - Extracts text from uploaded PDFs/DOCs and summarizes key details.
- **AI-Generated Realistic Interview Questions**
  - Based on resume, job description, and interview round type.
  - Mimics real-world industry interview scenarios.
- **AI Speech Integration**
  - AI reads out questions to simulate real interview experience.
- **Voice-Based Answering System**
  - Users respond via voice input.
  - Option to edit responses before submission.
- **Post-Interview AI-Generated Summary & Feedback**
  - **Interview Summary**
  - **Key Takeaways**
  - **Evaluation Metrics**
  - **Best Practices for Improvement**
- **Modern & Attractive UI**
  - User-friendly interface with seamless navigation.
- **Open-Source**
  - Fully open-source with scope for community contributions.

## Tech Stack
- **Frontend**: Bootstrap
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **AI Model**: Gemini API (Google AI Studio) for question generation and evaluation
- **SMTP Service**: Gmail SMTP for email verification

## Workflow
### 1. User Registration & Authentication
- Users sign up with an email.
- System sends login credentials via **Gmail SMTP**.
- Users log in using provided credentials.

### 2. Creating an Interview Space
- Users create a **"Space"** for a company.
- Inputs:
  - **Company Name**
  - **Job Description**
  - **Job Position**
  - **Interview Rounds** (Technical, HR, Aptitude, etc.)
  - **Resume Upload**
- System stores this data in MongoDB and **summarizes the resume using AI**.

### 3. Interview Process
- Users navigate to a **"Space"** to view interview rounds.
- Clicking on a round initiates the interview:
  - AI generates **realistic interview questions** based on resume, job description, and round type.
  - AI speaks the questions aloud.
  - Users **respond via voice input**.
  - Option to **edit responses** before submission.
- After all questions are answered, interview is **submitted for evaluation**.

### 4. AI-Generated Interview Summary & Feedback
- After the interview, AI generates:
  - **Interview Summary**
  - **Key Takeaways**
  - **Evaluation & Best Practices**

## Setting Up Gemini API (Google AI Studio)
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Create a new project.
3. Generate an API key.
4. Save the API key in the `.env` file.

## Installation Guide
### Prerequisites
- Install **Node.js** and **MongoDB**.
- Use **Google Chrome** for best compatibility.

### Setup Instructions
1. Clone the repository:
   ```sh
   git clone https://github.com/your-repo-name.git
   cd your-repo-name
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Configure environment variables:
   - Copy `.env-example` to `.env`:
     ```sh
     cp .env-example .env
     ```
   - Update `.env` with:
     - MongoDB URL
     - Gmail SMTP credentials (username, password)
     - Cookie session value
     - Gemini API key
4. Start the server:
   ```sh
   node server.js
   ```
5. Open the browser and access the application at `http://localhost:3000`.

## Output
### Screenshots & Video Demonstrations
- [Project Demo Video](https://your-demo-video-link.com)
- **Screenshots**:
  - Dashboard UI
  - Space Creation
  - Interview Questions Screen
  - Voice Answering System
  - AI-Generated Feedback & Summary

## Future Enhancements
1. **Custom AI Model Training**
   - Train an in-house AI model using real interview questions from top companies.
   - Reduce reliance on third-party AI APIs like Gemini.
2. **Advanced UI/UX Improvements**
   - More interactive elements, animations, and improved user experience.
3. **Mobile App Integration**
   - Extend functionality to mobile applications for better accessibility.
4. **Cloud Deployment**
   - Deploy on AWS/GCP for better scalability and global reach.

## Contributions
This project is **open-source forever!** Contributions are welcome. Feel free to:
- Improve UI/UX
- Optimize AI algorithms
- Enhance database efficiency
- Add new features

Fork the repository, make changes, and submit a **pull request**!

## License
This project is licensed under the MIT License.

---

### **Happy Coding & Best of Luck for Your Interviews!** 🚀

