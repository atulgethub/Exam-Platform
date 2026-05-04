import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import { 
  FiAward, FiCheckCircle, FiXCircle, FiDownload, 
  FiArrowLeft, FiClock, FiFileText, FiCode, FiBook 
} from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const ExamResults = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExamResults();
  }, [examId]);

  const fetchExamResults = async () => {
    try {
      const response = await api.get(`/results/exam/${examId}`);
      setExam(response.data.exam);
      setResult(response.data.result);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to load exam results');
      navigate('/my-results');
    } finally {
      setLoading(false);
    }
  };

  const exportResultPDF = async () => {
    try {
      const response = await api.get(`/results/export-pdf/${examId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `exam-result-${examId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Result exported successfully');
    } catch (error) {
      toast.error('Failed to export result');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!exam || !result) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FiXCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Result Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Unable to find your exam results</p>
          <button
            onClick={() => navigate('/my-results')}
            className="mt-4 btn-primary"
          >
            Back to Results
          </button>
        </div>
      </div>
    );
  }

  const percentage = (result.totalScore / exam.totalMarks) * 100;
  const isPassed = percentage >= 60;

  // Prepare chart data
  const mcqPerformance = result.answers.mcq.map((ans, idx) => ({
    question: `Q${idx + 1}`,
    marks: ans.marksObtained,
    total: exam.mcqQuestions[idx]?.marks || 0
  }));

  const codingPerformance = result.answers.coding.map((ans, idx) => ({
    question: exam.codingQuestions[idx]?.title?.substring(0, 20) || `Coding ${idx + 1}`,
    marks: ans.marksObtained,
    total: exam.codingQuestions[idx]?.marks || 0
  }));

  const pieData = [
    { name: 'Correct Answers', value: result.answers.mcq.filter(a => a.isCorrect).length },
    { name: 'Incorrect Answers', value: result.answers.mcq.filter(a => !a.isCorrect).length }
  ];

  const COLORS = ['#10B981', '#EF4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/my-results')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition"
          >
            <FiArrowLeft />
            Back to Results
          </button>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">{exam.title}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{exam.description}</p>
              </div>
              <button
                onClick={exportResultPDF}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <FiDownload />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full mb-3">
              <FiAward className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Total Score</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{result.totalScore}/{exam.totalMarks}</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full mb-3">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Percentage</p>
            <p className={`text-2xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
              {percentage.toFixed(1)}%
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-3">
              <FiClock className="h-6 w-6 text-blue-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Submitted</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {new Date(result.submittedAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-full mb-3">
              <FiFileText className="h-6 w-6 text-purple-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Status</p>
            <p className={`text-2xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
              {isPassed ? 'PASSED' : 'FAILED'}
            </p>
          </div>
        </div>

        {/* Performance Chart */}
        {mcqPerformance.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">MCQ Performance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mcqPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="question" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="marks" stroke="#10B981" name="Marks Obtained" />
                <Line type="monotone" dataKey="total" stroke="#EF4444" name="Total Marks" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* MCQ Results Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FiBook className="text-indigo-600" />
              MCQ Questions Analysis
            </h2>
            <div className="space-y-4">
              {exam.mcqQuestions.map((question, idx) => {
                const answer = result.answers.mcq[idx];
                const isCorrect = answer?.isCorrect || false;
                return (
                  <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium text-gray-800 dark:text-gray-200">Q{idx + 1}: {question.question}</p>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${isCorrect ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {isCorrect ? `+${question.marks}` : `0/${question.marks}`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Your answer: {answer?.selectedOption !== null ? question.options[answer.selectedOption] : 'Not answered'}
                    </p>
                    {!isCorrect && (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Correct answer: {question.options[question.correctAnswer]}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Coding Results Details */}
          {exam.codingQuestions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiCode className="text-indigo-600" />
                Coding Questions Analysis
              </h2>
              <div className="space-y-6">
                {exam.codingQuestions.map((question, idx) => {
                  const answer = result.answers.coding[idx];
                  return (
                    <div key={idx} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">{question.title}</h3>
                        <span className="bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded text-xs font-semibold text-indigo-800 dark:text-indigo-200">
                          {answer?.marksObtained || 0}/{question.marks} marks
                        </span>
                      </div>
                      <div className="mt-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Your Solution:</p>
                        <pre className="text-xs bg-gray-800 text-green-400 p-3 rounded overflow-x-auto">
                          {answer?.code || 'No code submitted'}
                        </pre>
                      </div>
                      {answer?.testResults && (
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Test Results:</p>
                          <div className="space-y-1">
                            {answer.testResults.map((test, testIdx) => (
                              <div key={testIdx} className="flex items-center gap-2 text-sm">
                                {test.passed ? (
                                  <FiCheckCircle className="text-green-500" />
                                ) : (
                                  <FiXCircle className="text-red-500" />
                                )}
                                <span className="text-gray-600 dark:text-gray-400">Test {testIdx + 1}:</span>
                                <span className={test.passed ? 'text-green-600' : 'text-red-600'}>
                                  {test.passed ? 'Passed' : 'Failed'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Score Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Score Distribution</h2>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            <div className="w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">MCQ Score:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {result.answers.mcq.reduce((sum, a) => sum + (a.marksObtained || 0), 0)}/{exam.mcqQuestions.reduce((sum, q) => sum + q.marks, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Coding Score:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {result.answers.coding.reduce((sum, a) => sum + (a.marksObtained || 0), 0)}/{exam.codingQuestions.reduce((sum, q) => sum + q.marks, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-gray-800 dark:text-gray-200">Total Score:</span>
                  <span className="font-bold text-xl text-indigo-600">{result.totalScore}/{exam.totalMarks}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;