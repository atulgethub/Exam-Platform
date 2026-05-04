import React from 'react';
import { FiClock, FiAward, FiUsers, FiPlayCircle, FiLock, FiUserCheck, FiAlertCircle } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ExamCard = ({ exam }) => {
  const navigate = useNavigate();

  const startExam = () => {
    // Check if exam is available
    const now = new Date();
    const startTime = new Date(exam.startTime);
    const endTime = new Date(exam.endTime);
    
    if (now < startTime) {
      toast.error(`This exam will start on ${startTime.toLocaleDateString()} at ${startTime.toLocaleTimeString()}`);
      return;
    }
    
    if (now > endTime) {
      toast.error('This exam has already ended');
      return;
    }
    
    // CRITICAL: Check if student has access to this exam
    const hasAccess = exam.isPublic === true || exam.isAllotted === true;
    
    if (!hasAccess) {
      toast.error('You are not authorized to take this exam. Only allotted students can access it.');
      return;
    }
    
    // Check if already taken
    if (exam.hasTaken) {
      toast.error('You have already completed this exam');
      return;
    }
    
    navigate(`/take-exam/${exam._id}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative h-48">
        <img 
          src={exam.imageUrl || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500'} 
          alt={exam.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-4 right-4 bg-indigo-600 text-white px-2 py-1 rounded-lg text-sm font-semibold">
          {exam.category || 'General'}
        </div>
        
        {/* Access Badge */}
        {exam.isAllotted && (
          <div className="absolute bottom-4 left-4 bg-yellow-500 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
            <FiUserCheck size={12} />
            Allotted to You
          </div>
        )}
        
        {exam.isPublic && !exam.isAllotted && (
          <div className="absolute bottom-4 left-4 bg-green-500 text-white px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1">
            <FiUsers size={12} />
            Public Exam
          </div>
        )}
        
        {exam.hasTaken && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-green-600 text-white px-4 py-2 rounded-full font-semibold">
              Completed ✓
            </span>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{exam.title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{exam.description}</p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <FiClock className="mr-2 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm">Duration: {exam.duration} minutes</span>
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <FiAward className="mr-2 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm">Total Marks: {exam.totalMarks}</span>
          </div>
          <div className="flex items-center text-gray-500 dark:text-gray-400">
            <FiUsers className="mr-2 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm">{exam.mcqQuestions?.length || 0} MCQ + {exam.codingQuestions?.length || 0} Coding</span>
          </div>
        </div>
        
        {exam.hasTaken ? (
          <button
            disabled
            className="w-full bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400 py-2 rounded-lg cursor-not-allowed font-semibold flex items-center justify-center gap-2"
          >
            <FiLock />
            Already Taken
          </button>
        ) : (
          <button
            onClick={startExam}
            disabled={!exam.isPublic && !exam.isAllotted}
            className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
              exam.isPublic || exam.isAllotted
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 cursor-pointer'
                : 'bg-gray-400 cursor-not-allowed text-gray-200'
            }`}
          >
            <FiPlayCircle />
            {exam.isPublic || exam.isAllotted ? 'Start Exam' : 'Not Accessible'}
          </button>
        )}
        
        {/* Access Info Message */}
        {!exam.isPublic && !exam.isAllotted && !exam.hasTaken && (
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2 flex items-center justify-center gap-1">
            <FiAlertCircle size={12} />
            This exam requires admin allotment
          </p>
        )}
      </div>
    </div>
  );
};

export default ExamCard;