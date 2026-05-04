const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student'
  },
  enrollmentNo: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// NO MIDDLEWARE - We'll hash password manually in the route
// This avoids all pre-save middleware issues

module.exports = mongoose.model('User', userSchema);