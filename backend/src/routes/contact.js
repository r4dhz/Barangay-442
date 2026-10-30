const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
require('dotenv').config();

// Expected fields from frontend
// firstName, lastName, email, phone, subject, message
router.post('/', async (req, res) => {
  const { firstName, lastName, email, phone, subject, message } = req.body;
  if (!email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const fullName = `${firstName || ''} ${lastName || ''}`.trim();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.RECIPIENT_EMAIL,
    replyTo: email, // Resident's email for easy reply
    subject: `[Barangay 442] ${subject.charAt(0).toUpperCase() + subject.slice(1)} - ${fullName}`,
    text: `Name: ${fullName}\nEmail: ${email}\nPhone: ${phone || 'N/A'}\n\nMessage:\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'Message sent' });
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).json({ success: false, error: 'Failed to send email' });
  }
});

module.exports = router;
