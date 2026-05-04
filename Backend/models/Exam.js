const mongoose = require('mongoose');

const mcqSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: Number,
  marks: Number
});

const codingSchema = new mongoose.Schema({
  title: String,
  description: String,
  testCases: [{
    input: String,
    output: String
  }],
  marks: Number
});

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  category: {
    type: String,
    enum: ['Programming', 'Mathematics', 'Science', 'English', 'General'],
    default: 'General'
  },
  imageUrl: {
    type: String,
    default: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500'
  },
  duration: {
    type: Number,
    required: true,
  },
  mcqQuestions: [mcqSchema],
  codingQuestions: [codingSchema],
  totalMarks: Number,
  startTime: Date,
  endTime: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  // NEW: Allotted students array
  allottedStudents: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    allottedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'started', 'completed'],
      default: 'pending'
    }
  }],
  // NEW: Is this exam publicly available or only for allotted students
  isPublic: {
    type: Boolean,
    default: false
  },
  enrolledStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  submissions: [{
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    answers: {
      mcq: [{
        questionIndex: Number,
        selectedOption: Number,
        isCorrect: Boolean,
        marksObtained: Number
      }],
      coding: [{
        questionIndex: Number,
        code: String,
        testResults: [{
          passed: Boolean,
          output: String,
          expectedOutput: String
        }],
        marksObtained: Number
      }]
    },
    totalScore: Number,
    submittedAt: Date,
    autoSubmitted: {
      type: Boolean,
      default: false
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Exam', examSchema);