const express = require('express');
const Exam = require('../models/Exam');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get student's results
router.get('/my-results', protect, async (req, res) => {
  try {
    const exams = await Exam.find({
      'submissions.student': req.user._id
    }).select('title totalMarks submissions totalScore');
    
    const results = exams.map(exam => {
      const submission = exam.submissions.find(
        sub => sub.student.toString() === req.user._id.toString()
      );
      return {
        examTitle: exam.title,
        score: submission.totalScore,
        totalMarks: exam.totalMarks,
        percentage: (submission.totalScore / exam.totalMarks) * 100,
        submittedAt: submission.submittedAt,
        autoSubmitted: submission.autoSubmitted
      };
    });
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Export results to PDF
router.get('/export-pdf/:examId', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId)
      .populate('submissions.student', 'name email enrollmentNo');
    
    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=exam-${exam._id}-results.pdf`);
    
    doc.pipe(res);
    
    doc.fontSize(20).text(exam.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).text(`Total Marks: ${exam.totalMarks}`, { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(16).text('Student Results:', { underline: true });
    doc.moveDown();
    
    exam.submissions.forEach((sub, idx) => {
      doc.fontSize(12).text(`${idx + 1}. ${sub.student.name} (${sub.student.enrollmentNo || 'N/A'})`);
      doc.text(`   Score: ${sub.totalScore}/${exam.totalMarks}`);
      doc.text(`   Percentage: ${((sub.totalScore / exam.totalMarks) * 100).toFixed(2)}%`);
      doc.text(`   Submitted: ${new Date(sub.submittedAt).toLocaleString()}`);
      doc.moveDown();
    });
    
    doc.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Export results to Excel
router.get('/export-excel/:examId', protect, async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.examId)
      .populate('submissions.student', 'name email enrollmentNo');
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Exam Results');
    
    worksheet.columns = [
      { header: 'S.No', key: 'sno', width: 10 },
      { header: 'Student Name', key: 'name', width: 30 },
      { header: 'Enrollment No', key: 'enrollment', width: 20 },
      { header: 'Email', key: 'email', width: 35 },
      { header: 'Score', key: 'score', width: 15 },
      { header: 'Percentage', key: 'percentage', width: 15 },
      { header: 'Submitted At', key: 'submittedAt', width: 25 },
      { header: 'Auto Submitted', key: 'autoSubmitted', width: 15 }
    ];
    
    exam.submissions.forEach((sub, idx) => {
      worksheet.addRow({
        sno: idx + 1,
        name: sub.student.name,
        enrollment: sub.student.enrollmentNo || 'N/A',
        email: sub.student.email,
        score: `${sub.totalScore}/${exam.totalMarks}`,
        percentage: ((sub.totalScore / exam.totalMarks) * 100).toFixed(2),
        submittedAt: new Date(sub.submittedAt).toLocaleString(),
        autoSubmitted: sub.autoSubmitted ? 'Yes' : 'No'
      });
    });
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=exam-${exam._id}-results.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;