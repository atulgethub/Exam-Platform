const mongoose = require('mongoose');
require('dotenv').config();

const Exam = require('./models/Exam');
const User = require('./models/User');

const fixExamAllotment = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Fix all exams - make them active with proper dates
    console.log('📋 Fixing all exams...');
    const updateResult = await Exam.updateMany(
      {},
      {
        $set: {
          isActive: true,
          startTime: new Date(),
          endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }
    );
    console.log(`✅ Updated ${updateResult.modifiedCount} exams\n`);

    // 2. List all students
    const students = await User.find({ role: 'student' });
    console.log('👥 Students found:');
    students.forEach(s => {
      console.log(`   - ${s.name} (${s.email}) - ID: ${s._id}`);
    });
    console.log();

    // 3. List all exams and their allotment status
    const exams = await Exam.find({});
    console.log('📚 Exams found:');
    for (const exam of exams) {
      console.log(`\n   Exam: "${exam.title}"`);
      console.log(`   ID: ${exam._id}`);
      console.log(`   isActive: ${exam.isActive}`);
      console.log(`   isPublic: ${exam.isPublic}`);
      console.log(`   Start: ${exam.startTime}`);
      console.log(`   End: ${exam.endTime}`);
      console.log(`   Allotted Students: ${exam.allottedStudents?.length || 0}`);
      
      if (exam.allottedStudents && exam.allottedStudents.length > 0) {
        for (const allot of exam.allottedStudents) {
          const student = await User.findById(allot.studentId);
          console.log(`      - ${student?.name || 'Unknown'} (${student?.email || 'Unknown'})`);
        }
      }
      
      // 4. If no students are allotted and exam is not public, allot to first student
      if (students.length > 0 && (!exam.allottedStudents || exam.allottedStudents.length === 0) && !exam.isPublic) {
        console.log(`\n   📌 Allotting exam "${exam.title}" to first student...`);
        
        if (!exam.allottedStudents) exam.allottedStudents = [];
        exam.allottedStudents.push({
          studentId: students[0]._id,
          allottedAt: new Date(),
          status: 'pending'
        });
        
        await exam.save();
        console.log(`   ✅ Allotted to ${students[0].name}`);
      }
    }

    // 5. Verify final state
    console.log('\n📊 Final Verification:');
    const finalExams = await Exam.find({}).populate('allottedStudents.studentId', 'name email');
    for (const exam of finalExams) {
      console.log(`\n   Exam: "${exam.title}"`);
      console.log(`   - isPublic: ${exam.isPublic}`);
      console.log(`   - Allotted: ${exam.allottedStudents?.length || 0} students`);
      if (exam.allottedStudents && exam.allottedStudents.length > 0) {
        exam.allottedStudents.forEach(a => {
          console.log(`     * ${a.studentId?.name} (${a.studentId?.email})`);
        });
      }
    }

    await mongoose.disconnect();
    console.log('\n✅ Fix completed!');
  } catch (error) {
    console.error('Error:', error);
  }
};

fixExamAllotment();