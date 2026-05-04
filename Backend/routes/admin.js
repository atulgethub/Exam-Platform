const express = require('express');
const Exam = require('../models/Exam');
const User = require('../models/User');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// Apply authentication and admin protection to all routes
router.use(protect, adminOnly);

// ============ EXISTING ROUTES ============

// Create exam
router.post('/exams', async (req, res) => {
  try {
    const examData = req.body;
    
    // Calculate total marks
    let totalMarks = 0;
    examData.mcqQuestions.forEach(q => totalMarks += q.marks);
    examData.codingQuestions.forEach(q => totalMarks += q.marks);
    examData.totalMarks = totalMarks;
    
    // Set default dates if not provided
    if (!examData.startTime) examData.startTime = new Date();
    if (!examData.endTime) examData.endTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const exam = await Exam.create(examData);
    res.status(201).json(exam);
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all exams
router.get('/exams', async (req, res) => {
  try {
    const exams = await Exam.find().sort('-createdAt');
    res.json(exams);
  } catch (error) {
    console.error('Fetch exams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get cheating logs for an exam
router.get('/cheating-logs/:examId', async (req, res) => {
  try {
    const CheatingLog = require('../models/CheatingLog');
    const logs = await CheatingLog.find({ exam: req.params.examId })
      .populate('student', 'name email enrollmentNo')
      .sort('-timestamp');
    res.json(logs);
  } catch (error) {
    console.error('Fetch cheating logs error:', error);
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
    console.error('Fetch results error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (error) {
    console.error('Fetch students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ============ ALLOTMENT ROUTES ============

// Get all students for allotment dropdown
router.get('/students/list', async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('_id name email enrollmentNo')
      .sort('name');
    res.json(students);
  } catch (error) {
    console.error('Fetch students list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get allotted students for a specific exam
router.get('/exams/:examId/allotted', async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId).populate('allottedStudents.studentId', 'name email enrollmentNo');
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    const allottedStudents = exam.allottedStudents.map(item => item.studentId);
    res.json(allottedStudents);
  } catch (error) {
    console.error('Fetch allotted students error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Allot exam to specific students
router.post('/exams/:examId/allot', async (req, res) => {
  try {
    const { examId } = req.params;
    const { studentIds } = req.body;
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Please provide an array of student IDs' });
    }
    
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    // Get existing allotted student IDs
    const existingAllottedIds = exam.allottedStudents.map(a => a.studentId.toString());
    
    // Filter out students already allotted
    const newStudentIds = studentIds.filter(id => !existingAllottedIds.includes(id));
    
    if (newStudentIds.length === 0) {
      return res.status(400).json({ message: 'All selected students already have this exam allotted' });
    }
    
    // Add new students to allottedStudents array
    const newAllotments = newStudentIds.map(studentId => ({
      studentId,
      allottedAt: new Date(),
      status: 'pending'
    }));
    
    exam.allottedStudents.push(...newAllotments);
    await exam.save();
    
    res.json({ 
      success: true,
      message: `Exam allotted to ${newStudentIds.length} student(s) successfully`,
      allottedCount: newStudentIds.length
    });
  } catch (error) {
    console.error('Allotment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove exam allotment from a student
router.delete('/exams/:examId/allot/:studentId', async (req, res) => {
  try {
    const { examId, studentId } = req.params;
    
    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    // Check if student has already taken the exam
    const hasSubmitted = exam.submissions.some(
      sub => sub.student.toString() === studentId
    );
    
    if (hasSubmitted) {
      return res.status(400).json({ 
        message: 'Cannot remove allotment. Student has already taken this exam.' 
      });
    }
    
    // Remove student from allottedStudents array
    exam.allottedStudents = exam.allottedStudents.filter(
      a => a.studentId.toString() !== studentId
    );
    
    await exam.save();
    
    res.json({ 
      success: true,
      message: 'Allotment removed successfully' 
    });
  } catch (error) {
    console.error('Remove allotment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get exams allotted to a specific student (for student dashboard)
router.get('/student-exams/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    const now = new Date();
    
    const exams = await Exam.find({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
      $or: [
        { isPublic: true },
        { 'allottedStudents.studentId': studentId }
      ]
    }).select('-mcqQuestions.correctAnswer');
    
    // Add hasTaken and isAllotted flags
    const examsWithStatus = exams.map(exam => {
      const hasTaken = exam.submissions.some(
        sub => sub.student.toString() === studentId
      );
      const isAllotted = exam.allottedStudents.some(
        a => a.studentId.toString() === studentId
      );
      
      return {
        ...exam.toObject(),
        hasTaken,
        isAllotted
      };
    });
    
    res.json(examsWithStatus);
  } catch (error) {
    console.error('Fetch student exams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update exam public/private status
router.patch('/exams/:examId/public', async (req, res) => {
  try {
    const { examId } = req.params;
    const { isPublic } = req.body;
    
    const exam = await Exam.findByIdAndUpdate(
      examId,
      { isPublic },
      { new: true }
    );
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    res.json({ 
      success: true,
      message: `Exam is now ${isPublic ? 'public' : 'private'}`,
      isPublic: exam.isPublic
    });
  } catch (error) {
    console.error('Update exam visibility error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete exam
router.delete('/exams/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    
    const exam = await Exam.findByIdAndDelete(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    res.json({ success: true, message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// DEBUG: Check exam allotment status
router.get('/debug/exam/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const exam = await Exam.findById(examId).populate('allottedStudents.studentId', 'name email');
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    const debugInfo = {
      examId: exam._id,
      title: exam.title,
      isActive: exam.isActive,
      isPublic: exam.isPublic,
      startTime: exam.startTime,
      endTime: exam.endTime,
      currentTime: new Date(),
      isTimeValid: exam.startTime <= new Date() && exam.endTime >= new Date(),
      allottedStudentsCount: exam.allottedStudents?.length || 0,
      allottedStudents: exam.allottedStudents?.map(a => ({
        studentId: a.studentId?._id || a.studentId,
        studentName: a.studentId?.name,
        studentEmail: a.studentId?.email,
        allottedAt: a.allottedAt,
        status: a.status
      }))
    };
    
    res.json(debugInfo);
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;