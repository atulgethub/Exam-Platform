const express = require('express');
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');
const { sendContactEmail } = require('../utils/emailService');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Submit contact form
router.post('/submit', [
  body('name').notEmpty().trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('subject').notEmpty().trim(),
  body('message').notEmpty().trim().isLength({ min: 10 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, subject, message } = req.body;
    
    // Save to database
    const contact = await Contact.create({
      name,
      email,
      subject,
      message
    });
    
    // Send email to admin
    await sendContactEmail({ name, email, subject, message });
    
    res.status(201).json({ 
      success: true, 
      message: 'Message sent successfully! We will get back to you soon.' 
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({ message: 'Failed to send message. Please try again.' });
  }
});

// Get all contact messages (admin only)
router.get('/messages', protect, adminOnly, async (req, res) => {
  try {
    const messages = await Contact.find().sort('-createdAt');
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark message as read (admin only)
router.put('/messages/:id/read', protect, adminOnly, async (req, res) => {
  try {
    const message = await Contact.findByIdAndUpdate(
      req.params.id,
      { status: 'read' },
      { new: true }
    );
    res.json(message);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;