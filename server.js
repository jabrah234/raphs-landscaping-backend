const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'https://raphs-landscaping.netlify.app' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '../frontend')));

// Add a test route to confirm the server is running
app.get('/test', (req, res) => {
  res.status(200).json({ message: 'Server is running' });
});

// Log all registered routes for debugging
app._router.stack.forEach((middleware) => {
  if (middleware.route) {
    console.log(`Route: ${middleware.route.path} - Methods: ${Object.keys(middleware.route.methods).join(', ')}`);
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.post('/submit', (req, res) => {
  console.log('Request headers:', req.headers);
  console.log('Raw request body:', req.body);
  const { name, email, phone, message } = req.body;

  console.log('Received form submission:', { name, email, phone, message });

  if (!name || !email || !phone || !message) {
    console.log('Validation failed: Missing fields');
    return res.status(400).json({ message: 'Please fill out all fields.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    console.log('Validation failed: Invalid email');
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: 'Raphael.hany.abraham@icloud.com',
    subject: 'New Contact Form Submission - Raphs Landscaping',
    text: `New form submission received:\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
    html: `<h2>New Contact Form Submission - Raphs Landscaping</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Phone:</strong> ${phone}</p><p><strong>Message:</strong> ${message}</p>`,
  };

  transporter.verify((error, success) => {
    if (error) {
      console.error('SMTP configuration error:', error);
      return res.status(500).json({ message: 'SMTP configuration error. Please try again later.' });
    }
    console.log('SMTP server connection verified:', success);

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ message: 'Error sending email. Please try again later.' });
      }
      console.log('Email sent successfully:', info.response);
      res.status(200).json({ message: 'Thank you! Your request has been submitted. We will contact you soon.' });
    });
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error. Please try again later.' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});