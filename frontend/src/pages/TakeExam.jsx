import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import CodeEditor from '../components/CodeEditor';
import ProctoringWarning from '../components/ProctoringWarning';
import { useWebSocket } from '../contexts/WebSocketContext';
import { 
  FiAlertTriangle, FiCheckCircle, FiCode, FiBook, FiClock, 
  FiSend, FiSave, FiAlertOctagon, FiMonitor, FiShield
} from 'react-icons/fi';

const TakeExam = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { reportCheating, joinExam, isConnected } = useWebSocket();
  
  // State variables
  const [exam, setExam] = useState(null);
  const [currentSection, setCurrentSection] = useState('mcq');
  const [answers, setAnswers] = useState({ mcq: [], coding: [] });
  const [timeLeft, setTimeLeft] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [violationCount, setViolationCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullscreenEnabled, setFullscreenEnabled] = useState(false);
  
  const timerRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // ============ PROCTORING SYSTEM ============
  
  // Force fullscreen mode
  const enableFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen()
        .then(() => setFullscreenEnabled(true))
        .catch(err => {
          console.error('Fullscreen error:', err);
          reportCheating(examId, user._id, 'fullscreen_failed', {});
          setWarningMessage('⚠️ Please enable fullscreen mode to continue the exam');
          setShowWarning(true);
        });
    }
  };

  // Check fullscreen status
  const checkFullscreen = () => {
    const isFullscreen = !!document.fullscreenElement;
    setFullscreenEnabled(isFullscreen);
    
    if (!isFullscreen && exam) {
      reportCheating(examId, user._id, 'fullscreen_exit', {});
      setViolationCount(prev => prev + 1);
      setWarningMessage('⚠️ CRITICAL: You exited fullscreen mode! This is a violation.');
      setShowWarning(true);
      
      // Re-enable fullscreen
      setTimeout(() => enableFullscreen(), 500);
    }
  };

  // Block all keyboard shortcuts
  const blockKeyboardShortcuts = (e) => {
    // Block F12 - Developer Tools
    if (e.key === 'F12') {
      e.preventDefault();
      reportCheating(examId, user._id, 'devtools_attempt', { key: 'F12' });
      setViolationCount(prev => prev + 1);
      setWarningMessage('⚠️ Developer tools are strictly prohibited!');
      setShowWarning(true);
      return false;
    }
    
    // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
      e.preventDefault();
      reportCheating(examId, user._id, 'devtools_attempt', { key: e.key });
      setViolationCount(prev => prev + 1);
      setWarningMessage('⚠️ Developer tools are strictly prohibited!');
      setShowWarning(true);
      return false;
    }
    
    // Block Ctrl+U (view source)
    if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      reportCheating(examId, user._id, 'view_source_attempt', {});
      setViolationCount(prev => prev + 1);
      setWarningMessage('⚠️ View source is not allowed!');
      setShowWarning(true);
      return false;
    }
    
    // Block Ctrl+R (refresh) - show warning but can't fully block
    if (e.ctrlKey && e.key === 'r') {
      e.preventDefault();
      reportCheating(examId, user._id, 'refresh_attempt', {});
      setWarningMessage('⚠️ Refreshing the page will auto-submit your exam!');
      setShowWarning(true);
      return false;
    }
    
    // Block Alt+F4 (close window)
    if (e.altKey && e.key === 'F4') {
      e.preventDefault();
      reportCheating(examId, user._id, 'close_window_attempt', {});
      setWarningMessage('⚠️ Closing the window will auto-submit your exam!');
      setShowWarning(true);
      return false;
    }
    
    // Block Ctrl+C, Ctrl+V, Ctrl+X
    if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x' || e.key === 'a')) {
      e.preventDefault();
      reportCheating(examId, user._id, 'copy_paste_attempt', { key: e.key });
      setViolationCount(prev => prev + 1);
      setWarningMessage('⚠️ Copy/Paste is not allowed during exam!');
      setShowWarning(true);
      return false;
    }
    
    // Block right-click
    if (e.button === 2) {
      e.preventDefault();
      reportCheating(examId, user._id, 'right_click_attempt', {});
      setViolationCount(prev => prev + 1);
      setWarningMessage('⚠️ Right-click is disabled during exam!');
      setShowWarning(true);
      return false;
    }
  };

  // Detect tab/window switching
  const handleVisibilityChange = () => {
    if (document.hidden) {
      reportCheating(examId, user._id, 'tab_switch_attempt', {});
      setViolationCount(prev => prev + 1);
      setWarningMessage('⚠️ Tab switching is strictly prohibited!');
      setShowWarning(true);
    }
  };

  // Detect window resize (potential cheating attempt)
  const handleResize = () => {
    if (window.innerWidth < 800 || window.innerHeight < 600) {
      reportCheating(examId, user._id, 'window_resize', { width: window.innerWidth, height: window.innerHeight });
      setWarningMessage('⚠️ Please maximize your window for optimal exam experience');
      setShowWarning(true);
    }
  };

  // Initialize proctoring
  useEffect(() => {
    if (!exam) return;
    
    // Enable fullscreen
    enableFullscreen();
    
    // Add event listeners
    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('keydown', blockKeyboardShortcuts);
    document.addEventListener('contextmenu', blockKeyboardShortcuts);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('resize', handleResize);
    
    // Join WebSocket room for proctoring
    if (isConnected && examId && user._id) {
      joinExam(examId, user._id);
    }
    
    // Warn about page refresh/close
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Your exam progress will be lost if you leave. Continue?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('keydown', blockKeyboardShortcuts);
      document.removeEventListener('contextmenu', blockKeyboardShortcuts);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [exam, examId, user._id, reportCheating, joinExam, isConnected]);

  // Auto-submit on 3 violations
  useEffect(() => {
    if (violationCount >= 3 && exam) {
      handleSubmit(true);
      toast.error('⚠️ Multiple violations detected. Exam auto-submitted!');
    }
  }, [violationCount]);

  // Fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await api.get(`/exam/${examId}`);
        setExam(response.data);
        setTimeLeft(response.data.duration * 60);
        
        // Initialize answers
        const mcqAnswers = response.data.mcqQuestions.map((_, idx) => ({
          questionIndex: idx,
          selectedOption: null
        }));
        
        const codingAnswers = response.data.codingQuestions.map((_, idx) => ({
          questionIndex: idx,
          code: '// Write your solution here\n\nfunction solve(input) {\n    // Your code here\n    return result;\n}'
        }));
        
        setAnswers({ mcq: mcqAnswers, coding: codingAnswers });
      } catch (error) {
        console.error('Error fetching exam:', error);
        if (error.response?.status === 401) {
          navigate('/login');
        } else if (error.response?.status === 400) {
          toast.error(error.response.data.message);
          navigate('/dashboard');
        } else {
          toast.error('Failed to load exam');
          navigate('/dashboard');
        }
      }
    };
    
    if (examId && user._id) {
      fetchExam();
    }
  }, [examId, navigate, user._id]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !isSubmitting && exam) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timeLeft, isSubmitting, exam]);

  // Submit exam
  const handleSubmit = async (autoSubmit = false) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    
    try {
      await api.post(`/exam/${examId}/submit`, { answers });
      
      toast.success(autoSubmit ? 'Exam auto-submitted!' : 'Exam submitted successfully!');
      
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit exam. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Update MCQ answer
  const updateMCQAnswer = (questionIndex, selectedOption) => {
    const updatedMcq = [...answers.mcq];
    updatedMcq[questionIndex] = { questionIndex, selectedOption };
    setAnswers({ ...answers, mcq: updatedMcq });
  };

  // Update coding answer
  const updateCodeAnswer = (questionIndex, code) => {
    const updatedCoding = [...answers.coding];
    updatedCoding[questionIndex] = { questionIndex, code };
    setAnswers({ ...answers, coding: updatedCoding });
  };

  if (!exam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const answeredCount = answers.mcq.filter(a => a.selectedOption !== null).length;
  const totalMcq = exam.mcqQuestions.length;
  const progress = totalMcq > 0 ? (answeredCount / totalMcq) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Warning Modal */}
      {showWarning && (
        <ProctoringWarning 
          message={warningMessage} 
          onClose={() => setShowWarning(false)} 
        />
      )}
      
      {/* Proctoring Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-3 text-center font-semibold shadow-lg sticky top-0 z-20">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FiShield className="animate-pulse" />
            <span>Proctoring Active</span>
          </div>
          <div className="flex items-center gap-2">
            <FiMonitor />
            <span>{fullscreenEnabled ? '✓ Fullscreen Mode' : '⚠️ Fullscreen Required'}</span>
          </div>
          {!isConnected && (
            <div className="flex items-center gap-2 text-yellow-300">
              <FiAlertOctagon />
              <span>Reconnecting to Proctor...</span>
            </div>
          )}
          {violationCount > 0 && (
            <div className="flex items-center gap-2 bg-red-800 px-3 py-1 rounded-full">
              <FiAlertTriangle />
              <span>Violations: {violationCount}/3</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Exam Header */}
      <div className="sticky top-12 bg-white dark:bg-gray-800 shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{exam.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{exam.description}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`text-3xl font-bold flex items-center gap-2 ${
                timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-indigo-600 dark:text-indigo-400'
              }`}>
                <FiClock className="inline" />
                {formatTime(timeLeft)}
              </div>
              
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition shadow-md disabled:opacity-50 flex items-center gap-2 font-semibold"
              >
                <FiSend />
                {isSubmitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600 dark:text-gray-400">MCQ Progress: {answeredCount}/{totalMcq} Questions</span>
              <span className="text-gray-600 dark:text-gray-400">{progress.toFixed(0)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Section Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setCurrentSection('mcq')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-200 ${
              currentSection === 'mcq'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <FiBook />
            MCQ Questions ({exam.mcqQuestions.length})
          </button>
          <button
            onClick={() => setCurrentSection('coding')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold transition-all duration-200 ${
              currentSection === 'coding'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <FiCode />
            Coding Questions ({exam.codingQuestions.length})
          </button>
        </div>
        
        {/* MCQ Questions Section */}
        {currentSection === 'mcq' && (
          <div className="space-y-6">
            {exam.mcqQuestions.map((question, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Question {idx + 1}: {question.question}
                  </h3>
                  <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-sm font-semibold">
                    {question.marks} marks
                  </span>
                </div>
                <div className="space-y-3">
                  {question.options.map((option, optIdx) => (
                    <label 
                      key={optIdx} 
                      className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        answers.mcq[idx]?.selectedOption === optIdx
                          ? 'bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-500'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`mcq-${idx}`}
                        value={optIdx}
                        checked={answers.mcq[idx]?.selectedOption === optIdx}
                        onChange={() => updateMCQAnswer(idx, optIdx)}
                        className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Coding Questions Section */}
        {currentSection === 'coding' && (
          <div className="space-y-8">
            {exam.codingQuestions.map((question, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h3 className="text-xl font-semibold">
                      {question.title}
                    </h3>
                    <span className="bg-indigo-600 px-3 py-1 rounded-full text-sm font-semibold">
                      {question.marks} marks
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-wrap leading-relaxed">
                    {question.description}
                  </p>
                  
                  {question.testCases && question.testCases.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <FiCheckCircle className="text-green-600" />
                        Sample Test Cases:
                      </h4>
                      <div className="space-y-2">
                        {question.testCases.map((test, testIdx) => (
                          <div key={testIdx} className="text-sm font-mono bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                            <div><span className="text-gray-500">Input:</span> {test.input}</div>
                            <div><span className="text-gray-500">Expected Output:</span> <span className="text-green-600">{test.output}</span></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <CodeEditor
                    value={answers.coding[idx]?.code || ''}
                    onChange={(code) => updateCodeAnswer(idx, code)}
                    language="javascript"
                  />
                  
                  <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <FiCode />
                    Write your solution in the editor. Make sure to return the correct output for all test cases.
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Floating Submit Button */}
        <div className="fixed bottom-8 right-8 z-20">
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-full hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-xl font-semibold text-lg flex items-center gap-2 disabled:opacity-50 animate-bounce"
          >
            <FiSend />
            {isSubmitting ? 'Submitting...' : 'Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TakeExam;