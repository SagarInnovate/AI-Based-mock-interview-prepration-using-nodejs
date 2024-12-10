const nodemailer = require('nodemailer');

// Create and export the transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER, // Environment variable for email
    pass: process.env.GMAIL_PASS, // Environment variable for app password
  },
});

module.exports = transporter;
