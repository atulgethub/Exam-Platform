import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import { FiAward, FiBarChart2, FiDownload, FiEye } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MyResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await api.get('/results/my-results');
      setResults(response.data || []);
    } catch (error) {
      console.error('Error fetching results:', error);
      toast.error('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const viewExamDetails = (examId) => {
    navigate(`/exam-results/${examId}`);
  };

  const exportResults = async () => {
    try {
      const response = await api.get('/results/export-pdf', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'my-exam-results.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Results exported successfully');
    } catch (error) {
      toast.error('Failed to export results');
    }
  };

  const chartData = results.map(r => ({
    name: r.examTitle?.substring(0, 15),
    score: r.percentage,
    date: new Date(r.submittedAt).toLocaleDateString()
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Exam Results</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track your performance across all exams</p>
          </div>
          {results.length > 0 && (
            <button
              onClick={exportResults}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              <FiDownload />
              Export Results
            </button>
          )}
        </div>

        {results.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <FiAward className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No Results Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">You haven't taken any exams yet.</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 btn-primary"
            >
              Browse Available Exams
            </button>
          </div>
        ) : (
          <>
            {/* Performance Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Performance Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Results Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Exam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Percentage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {results.map((result, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{result.examTitle}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{result.score}/{result.totalMarks}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mr-2 w-24">
                              <div 
                                className={`h-2 rounded-full ${result.percentage >= 60 ? 'bg-green-600' : 'bg-red-600'}`}
                                style={{ width: `${result.percentage}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-semibold ${result.percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                              {result.percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(result.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full ${result.percentage >= 60 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                            {result.percentage >= 60 ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => viewExamDetails(result.examId)}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 flex items-center gap-1"
                          >
                            <FiEye /> Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Average Score</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {(results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(1)}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Highest Score</p>
                <p className="text-3xl font-bold text-green-600">
                  {Math.max(...results.map(r => r.percentage)).toFixed(1)}%
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Exams Taken</p>
                <p className="text-3xl font-bold text-indigo-600">{results.length}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyResults;