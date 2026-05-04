import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import CodeEditor from '../components/CodeEditor';
import ProctoringWarning from '../components/ProctoringWarning';
import { useWebSocket } from '../contexts/WebSocketContext';
import { FiAlertTriangle, FiCheckCircle, FiCode, FiBook, FiClock, FiSend } from 'react-icons/fi';

const ExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { reportCheating, joinExam, isConnected } = useWebSocket();
  const [exam, setExam] = useState(null);
  const [currentSection, setCurrentSection] = useState('mcq');
  const [answers, setAnswers] = useState({ mcq: [], coding: [] });
  const [timeLeft, setTimeLeft] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [violationCount, setViolationCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const timerRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Proctoring measures - blocks cheating attempts
  useEffect(() => {
    const requestFullscreen = () => {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => {
          console.error('Fullscreen error:', err);
        });
      }
    };

    const checkFullscreen = () => {
      if (!document.fullscreenElement) {
        reportCheating(examId, user._id, 'fullscreen_exit', {});
        setViolationCount(prev => prev + 1);
        setWarningMessage('⚠️ Warning: You exited fullscreen mode! Please return to fullscreen.');
        setShowWarning(true);
        requestFullscreen();
      }
    };

    const blockKeyboard = (e) => {
      // Block F12 - Developer Tools
      if (e.key === 'F12') {
        e.preventDefault();
        reportCheating(examId, user._id, 'keyboard_shortcut', { key: 'F12' });
        setViolationCount(prev => prev + 1);
        setWarningMessage('⚠️ Warning: Developer tools are not allowed!');
        setShowWarning(true);
        return false;
      }
      
      // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) {
        e.preventDefault();
        reportCheating(examId, user._id, 'keyboard_shortcut', { key: e.key });
        setViolationCount(prev => prev + 1);
        setWarningMessage('⚠️ Warning: Developer tools are not allowed!');
        setShowWarning(true);
        return false;
      }
      
      // Block Ctrl+U (view source)
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        reportCheating(examId, user._id, 'keyboard_shortcut', { key: 'Ctrl+U' });
        setViolationCount(prev => prev + 1);
        setWarningMessage('⚠️ Warning: View source is not allowed!');
        setShowWarning(true);
        return false;
      }
      
      // Block Ctrl+C, Ctrl+V, Ctrl+X (copy/paste/cut)
      if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
        reportCheating(examId, user._id, 'copy_paste', { key: e.key });
        setViolationCount(prev => prev + 1);
        setWarningMessage('⚠️ Warning: Copy/Paste is not allowed during exam!');
        setShowWarning(true);
        return false;
      }
      
      // Block Alt+Tab detection
      if (e.altKey && e.key === 'Tab') {
        reportCheating(examId, user._id, 'tab_switch', {});
        setViolationCount(prev => prev + 1);
        setWarningMessage('⚠️ Warning: Tab switching is not allowed!');
        setShowWarning(true);
      }
    };

    const blockRightClick = (e) => {
      e.preventDefault();
      reportCheating(examId, user._id, 'right_click', {});
      setViolationCount(prev => prev + 1);
      setWarningMessage('⚠️ Warning: Right-click is disabled during exam!');
      setShowWarning(true);
      return false;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportCheating(examId, user._id, 'tab_switch', {});
        setViolationCount(prev => prev + 1);
        setWarningMessage('⚠️ Warning: Tab switching is not allowed!');
        setShowWarning(true);
      }
    };

    // Initialize proctoring
    requestFullscreen();
    document.addEventListener('fullscreenchange', checkFullscreen);
    document.addEventListener('keydown', blockKeyboard);
    document.addEventListener('contextmenu', blockRightClick);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Join WebSocket room for real-time monitoring
    if (isConnected && examId && user._id) {
      joinExam(examId, user._id);
    }

    return () => {
      document.removeEventListener('fullscreenchange', checkFullscreen);
      document.removeEventListener('keydown', blockKeyboard);
      document.removeEventListener('contextmenu', blockRightClick);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [examId, user._id, reportCheating, joinExam, isConnected]);

  // Auto-submit on 3 violations
  useEffect(() => {
    if (violationCount >= 3) {
      handleSubmit(true);
      toast.error('Multiple violations detected. Exam auto-submitted!');
    }
  }, [violationCount]);

  // Fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await api.get(`/exam/${examId}`);
        setExam(response.data);
        setTimeLeft(response.data.duration * 60);
        
        // Initialize answers array
        const mcqAnswers = response.data.mcqQuestions.map((_, idx) => ({
          questionIndex: idx,
          selectedOption: null
        }));
        const codingAnswers = response.data.codingQuestions.map((_, idx) => ({
          questionIndex: idx,
          code: '// Write your solution here\n\nfunction solve() {\n    \n    return result;\n}'
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
    if (timeLeft > 0 && !isSubmitting) {
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
  }, [timeLeft, isSubmitting]);

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
      
      toast.success(autoSubmit ? 'Exam auto-submitted successfully!' : 'Exam submitted successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit exam. Please try again.');
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const updateMCQAnswer = (questionIndex, selectedOption) => {
    const updatedMcq = [...answers.mcq];
    updatedMcq[questionIndex] = { questionIndex, selectedOption };
    setAnswers({ ...answers, mcq: updatedMcq });
  };

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
    <div className="min-h-screen bg-gray-100">
      {/* Warning Alert */}
      {showWarning && (
        <ProctoringWarning 
          message={warningMessage} 
          onClose={() => setShowWarning(false)} 
        />
      )}
      
      {/* Proctoring Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-3 text-center font-semibold shadow-lg sticky top-0 z-20">
        <FiAlertTriangle className="inline mr-2 mb-1" />
        Proctoring Active - Fullscreen Mode Required - Tab Switching is Prohibited
        {!isConnected && (
          <span className="ml-2 text-yellow-300"> (Reconnecting to proctor...)</span>
        )}
        {violationCount > 0 && (
          <span className="ml-2 bg-red-800 px-2 py-0.5 rounded-full text-sm">
            Violations: {violationCount}/3
          </span>
        )}
      </div>
      
      {/* Exam Header with Timer */}
      <div className="sticky top-12 bg-white shadow-lg z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h1 className="text-xl font-bold text-gray-800">{exam.title}</h1>
            <div className={`text-2xl font-bold flex items-center gap-2 ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-indigo-600'}`}>
              <FiClock className="inline" />
              Time Left: {formatTime(timeLeft)}
            </div>
            <button
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition shadow-md disabled:opacity-50 flex items-center gap-2"
            >
              <FiSend />
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span>MCQ Progress: {answeredCount}/{totalMcq} Questions</span>
              <span>{progress.toFixed(0)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
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
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setCurrentSection('mcq')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition ${
              currentSection === 'mcq'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FiBook />
            MCQ Questions ({exam.mcqQuestions.length})
          </button>
          <button
            onClick={() => setCurrentSection('coding')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg font-semibold transition ${
              currentSection === 'coding'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
              <div key={idx} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Question {idx + 1}: {question.question}
                  </h3>
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-sm font-semibold">
                    {question.marks} marks
                  </span>
                </div>
                <div className="space-y-3">
                  {question.options.map((option, optIdx) => (
                    <label key={optIdx} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition border border-gray-100">
                      <input
                        type="radio"
                        name={`mcq-${idx}`}
                        value={optIdx}
                        checked={answers.mcq[idx]?.selectedOption === optIdx}
                        onChange={() => updateMCQAnswer(idx, optIdx)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-gray-700">{option}</span>
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
              <div key={idx} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-semibold">
                      {question.title}
                    </h3>
                    <span className="bg-indigo-600 px-3 py-1 rounded text-sm font-semibold">
                      {question.marks} marks
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed">
                    {question.description}
                  </p>
                  
                  {question.testCases && question.testCases.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <FiCheckCircle className="text-green-600" />
                        Sample Test Cases:
                      </h4>
                      <div className="space-y-2">
                        {question.testCases.map((test, testIdx) => (
                          <div key={testIdx} className="text-sm font-mono bg-white p-2 rounded border">
                            <span className="text-gray-600">Input:</span> {test.input}
                            <br />
                            <span className="text-gray-600">Expected Output:</span> {test.output}
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
                  
                  <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
                    <FiCode />
                    Write your solution in the editor above. Make sure to return the correct output.
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Submit Button at Bottom */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition shadow-lg font-semibold text-lg flex items-center gap-2 disabled:opacity-50"
          >
            <FiSend />
            {isSubmitting ? 'Submitting Exam...' : 'Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;