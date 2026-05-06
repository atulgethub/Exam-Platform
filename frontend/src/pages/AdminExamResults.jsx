import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import { 
  FiAward, FiDownload, FiArrowLeft, FiUsers, FiBarChart2, 
  FiTrendingUp, FiStar, FiUserCheck, FiFileText, FiCheckCircle, FiXCircle
} from 'react-icons/fi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

const AdminExamResults = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
    passCount: 0,
    failCount: 0
  });

  useEffect(() => {
    if (examId) {
      fetchExamResults();
    } else {
      toast.error('No exam ID provided');
      navigate('/admin');
    }
  }, [examId]);

  const fetchExamResults = async () => {
    try {
      setLoading(true);
      console.log('Fetching exam results for ID:', examId);
      
      // Fetch exam details
      const examRes = await api.get(`/admin/exams/${examId}`);
      console.log('Exam data:', examRes.data);
      setExam(examRes.data);
      
      // Fetch results for this exam
      const resultsRes = await api.get(`/admin/results/${examId}`);
      console.log('Results data:', resultsRes.data);
      const resultsData = resultsRes.data || [];
      setResults(resultsData);
      
      // Calculate statistics
      if (resultsData.length > 0 && examRes.data) {
        const totalMarks = examRes.data.totalMarks;
        const scores = resultsData.map(r => (r.totalScore / totalMarks) * 100);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        const highest = Math.max(...scores);
        const lowest = Math.min(...scores);
        const passed = scores.filter(s => s >= 60).length;
        
        setStats({
          totalStudents: resultsData.length,
          averageScore: avgScore,
          highestScore: highest,
          lowestScore: lowest,
          passCount: passed,
          failCount: resultsData.length - passed
        });
      }
    } catch (error) {
      console.error('Error fetching exam results:', error);
      toast.error('Failed to load exam results');
      navigate('/admin');
    } finally {
      setLoading(false);
    }
  };

  const exportResultsToExcel = async () => {
    try {
      const response = await api.get(`/results/export-excel/${examId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `exam-${exam?.title || 'results'}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Results exported to Excel successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export results');
    }
  };

  const exportResultsToPDF = async () => {
    try {
      const response = await api.get(`/results/export-pdf/${examId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `exam-${exam?.title || 'results'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Results exported to PDF successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export results');
    }
  };

  const scoreDistribution = [
    { range: '0-20%', count: results.filter(r => exam && (r.totalScore / exam.totalMarks) * 100 < 20).length },
    { range: '20-40%', count: results.filter(r => exam && (r.totalScore / exam.totalMarks) * 100 >= 20 && (r.totalScore / exam.totalMarks) * 100 < 40).length },
    { range: '40-60%', count: results.filter(r => exam && (r.totalScore / exam.totalMarks) * 100 >= 40 && (r.totalScore / exam.totalMarks) * 100 < 60).length },
    { range: '60-80%', count: results.filter(r => exam && (r.totalScore / exam.totalMarks) * 100 >= 60 && (r.totalScore / exam.totalMarks) * 100 < 80).length },
    { range: '80-100%', count: results.filter(r => exam && (r.totalScore / exam.totalMarks) * 100 >= 80).length }
  ];

  const passFailData = [
    { name: 'Passed', value: stats.passCount, color: '#10B981' },
    { name: 'Failed', value: stats.failCount, color: '#EF4444' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition"
          >
            <FiArrowLeft />
            Back to Admin Dashboard
          </button>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {exam?.title || 'Exam'} - Results
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Total Marks: {exam?.totalMarks || 0} | Total Students: {stats.totalStudents}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={exportResultsToExcel}
                  className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                  <FiDownload />
                  Export Excel
                </button>
                <button
                  onClick={exportResultsToPDF}
                  className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  <FiDownload />
                  Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {results.length > 0 && exam && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Total Students</p>
                  <p className="text-3xl font-bold text-indigo-600">{stats.totalStudents}</p>
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-full p-3">
                  <FiUsers className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Average Score</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.averageScore.toFixed(1)}%</p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-3">
                  <FiTrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Highest Score</p>
                  <p className="text-3xl font-bold text-green-600">{stats.highestScore.toFixed(1)}%</p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/50 rounded-full p-3">
                  <FiStar className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Pass Rate</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {stats.totalStudents > 0 ? ((stats.passCount / stats.totalStudents) * 100).toFixed(1) : 0}%
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/50 rounded-full p-3">
                  <FiUserCheck className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {results.length > 0 && exam && (
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Score Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={scoreDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#4F46E5" name="Number of Students" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pass/Fail Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={passFailData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {passFailData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student Results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">S.No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Submitted</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {results.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <FiFileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                      No students have taken this exam yet.
                    </td>
                  </tr>
                ) : (
                  results.map((result, idx) => {
                    const percentage = exam ? (result.totalScore / exam.totalMarks) * 100 : 0;
                    return (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{idx + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {result.student?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {result.student?.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white">
                          {result.totalScore}/{exam?.totalMarks || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mr-2 w-20">
                              <div 
                                className={`h-2 rounded-full ${percentage >= 60 ? 'bg-green-600' : 'bg-red-600'}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-semibold ${percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                              {percentage.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 w-fit ${
                            percentage >= 60 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {percentage >= 60 ? <FiCheckCircle size={12} /> : <FiXCircle size={12} />}
                            {percentage >= 60 ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(result.submittedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminExamResults;