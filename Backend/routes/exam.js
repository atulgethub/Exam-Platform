const express = require('express');
const Exam = require('../models/Exam');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get all exams available to the student (public + allotted)
router.get('/all', protect, async (req, res) => {
  try {
    const now = new Date();
    const studentId = req.user._id;
    
    console.log('📚 GET /api/exam/all - Student:', studentId.toString());
    
    const exams = await Exam.find({
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now },
      $or: [
        { isPublic: true },
        { 'allottedStudents.studentId': studentId }
      ]
    });
    
    // Remove correct answers before sending
    const examsWithoutAnswers = exams.map(exam => {
      const examObj = exam.toObject();
      const hasTaken = exam.submissions.some(
        sub => sub.student.toString() === studentId.toString()
      );
      const isAllotted = exam.allottedStudents?.some(
        allot => allot.studentId.toString() === studentId.toString()
      );
      
      return {
        ...examObj,
        mcqQuestions: examObj.mcqQuestions?.map(q => ({
          question: q.question,
          options: q.options,
          marks: q.marks
        })) || [],
        hasTaken,
        isAllotted: isAllotted || false
      };
    });
    
    console.log(`✅ Found ${examsWithoutAnswers.length} exams for student`);
    res.json(examsWithoutAnswers);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get specific exam by ID
router.get('/:examId', protect, async (req, res) => {
  try {
    const { examId } = req.params;
    const studentId = req.user._id;
    
    console.log(`📖 GET /api/exam/${examId} - Student: ${studentId}`);
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(examId)) {
      console.log('❌ Invalid exam ID format:', examId);
      return res.status(400).json({ message: 'Invalid exam ID format' });
    }
    
    const exam = await Exam.findById(examId);
    
    if (!exam) {
      console.log('❌ Exam not found:', examId);
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    console.log('📝 Exam found:', exam.title);
    
    // Check if student has access
    const hasAccess = exam.isPublic || 
      exam.allottedStudents?.some(allot => allot.studentId.toString() === studentId.toString());
    
    if (!hasAccess) {
      console.log('🚫 Student does not have access to this exam');
      return res.status(403).json({ message: 'You are not authorized to take this exam' });
    }
    
    // Check if already submitted
    const hasSubmitted = exam.submissions?.some(
      sub => sub.student.toString() === studentId.toString()
    );
    
    if (hasSubmitted) {
      console.log('⚠️ Student has already taken this exam');
      return res.status(400).json({ message: 'You have already taken this exam' });
    }
    
    // Remove correct answers before sending
    const examWithoutAnswers = {
      _id: exam._id,
      title: exam.title,
      description: exam.description,
      category: exam.category,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      startTime: exam.startTime,
      endTime: exam.endTime,
      mcqQuestions: exam.mcqQuestions?.map(q => ({
        question: q.question,
        options: q.options,
        marks: q.marks
      })) || [],
      codingQuestions: exam.codingQuestions?.map(q => ({
        title: q.title,
        description: q.description,
        testCases: q.testCases,
        marks: q.marks
      })) || []
    };
    
    console.log('✅ Exam data sent to student');
    res.json(examWithoutAnswers);
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Submit exam answers
router.post('/:examId/submit', protect, async (req, res) => {
  try {
    const { examId } = req.params;
    const { answers } = req.body;
    const studentId = req.user._id;
    
    console.log(`📤 POST /api/exam/${examId}/submit - Student: ${studentId}`);
    
    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    // Check if already submitted
    const alreadySubmitted = exam.submissions?.some(
      sub => sub.student.toString() === studentId.toString()
    );
    
    if (alreadySubmitted) {
      return res.status(400).json({ message: 'You have already submitted this exam' });
    }
    
    let totalScore = 0;
    
    // Grade MCQ questions
    const gradedMcqAnswers = answers.mcq?.map((ans, idx) => {
      const question = exam.mcqQuestions[ans.questionIndex];
      const isCorrect = ans.selectedOption === question.correctAnswer;
      const marksObtained = isCorrect ? question.marks : 0;
      totalScore += marksObtained;
      return {
        ...ans,
        isCorrect,
        marksObtained
      };
    }) || [];
    
    // Grade Coding questions (simplified - in production you'd run actual tests)
    const gradedCodingAnswers = answers.coding?.map((ans, idx) => {
      const question = exam.codingQuestions[ans.questionIndex];
      let marksObtained = 0;
      
      if (question?.testCases && question.testCases.length > 0) {
        // Simulate test execution - replace with actual code execution in production
        const passedCount = Math.floor(Math.random() * (question.testCases.length + 1));
        marksObtained = (passedCount / question.testCases.length) * question.marks;
      } else if (question) {
        marksObtained = question.marks * 0.5; // Default 50% for submission without tests
      }
      
      totalScore += marksObtained;
      
      return {
        ...ans,
        testResults: question?.testCases?.map((testCase) => ({
          passed: Math.random() > 0.3,
          output: 'Sample output',
          expectedOutput: testCase.output
        })) || [],
        marksObtained
      };
    }) || [];
    
    // Save submission
    if (!exam.submissions) exam.submissions = [];
    exam.submissions.push({
      student: studentId,
      answers: {
        mcq: gradedMcqAnswers,
        coding: gradedCodingAnswers
      },
      totalScore,
      submittedAt: new Date(),
      autoSubmitted: false
    });
    
    await exam.save();
    
    console.log(`✅ Exam submitted. Score: ${totalScore}/${exam.totalMarks}`);
    
    res.json({
      success: true,
      message: 'Exam submitted successfully',
      totalScore,
      totalPossible: exam.totalMarks,
      percentage: (totalScore / exam.totalMarks) * 100
    });
  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add mongoose at the top of the file
const mongoose = require('mongoose');

module.exports = router;