const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Register - Manual password hashing
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required').trim(),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('enrollmentNo').optional().trim()
], async (req, res) => {
  console.log('📝 Registration request received:', { 
    name: req.body.name, 
    email: req.body.email 
  });
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  
  try {
    const { name, email, password, enrollmentNo } = req.body;
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }
    
    // Hash password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user with hashed password
    const user = new User({
      name,
      email,
      password: hashedPassword,
      enrollmentNo: enrollmentNo || undefined,
      role: 'student'
    });
    
    await user.save();
    
    console.log('✅ User created successfully:', user._id);
    
    const token = generateToken(user._id);
    
    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      enrollmentNo: user.enrollmentNo,
      token
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field} already exists. Please use a different ${field}.` 
      });
    }
    
    res.status(500).json({ 
      message: 'Server error. Please try again later.'
    });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  console.log('🔐 Login request received:', { email: req.body.email });
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    // Compare password manually
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    
    console.log('✅ Login successful for user:', user._id);
    
    const token = generateToken(user._id);
    
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      enrollmentNo: user.enrollmentNo,
      token
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      _id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      enrollmentNo: req.user.enrollmentNo
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;