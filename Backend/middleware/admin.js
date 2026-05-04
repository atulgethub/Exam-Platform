const express = require('express');
const Exam = require('../models/Exam');
const CheatingLog = require('../models/CheatingLog');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect, adminOnly);

// Create exam
router.post('/exams', async (req, res) => {
  try {
    const examData = req.body;
    
    let totalMarks = 0;
    examData.mcqQuestions.forEach(q => totalMarks += q.marks);
    examData.codingQuestions.forEach(q => totalMarks += q.marks);
    examData.totalMarks = totalMarks;
    
    const exam = await Exam.create(examData);
    res.status(201).json(exam);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all exams
router.get('/exams', async (req, res) => {
  try {
    const exams = await Exam.find().sort('-createdAt');
    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get cheating logs for an exam
router.get('/cheating-logs/:examId', async (req, res) => {
  try {
    const logs = await CheatingLog.find({ exam: req.params.examId })
      .populate('student', 'name email enrollmentNo')
      .sort('-timestamp');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get exam results
router.get('/results/:examId', async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId)
      .populate('submissions.student', 'name email enrollmentNo');
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    const results = exam.submissions.map(sub => ({
      student: sub.student,
      totalScore: sub.totalScore,
      submittedAt: sub.submittedAt,
      autoSubmitted: sub.autoSubmitted
    }));
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;