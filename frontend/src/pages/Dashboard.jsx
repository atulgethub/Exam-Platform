import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FiClock, FiAward, FiTrendingUp, FiBookOpen, FiBarChart2, 
  FiUserCheck, FiAlertCircle 
} from 'react-icons/fi';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import api from '../utils/axiosConfig';
import ExamCard from '../components/ExamCard';

const Dashboard = () => {
  const [exams, setExams] = useState([]);
  const [allottedExams, setAllottedExams] = useState([]);
  const [publicExams, setPublicExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (err) {
        console.error('Error parsing user:', err);
      }
    }
    
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const examsRes = await api.get('/exam/all');
      const resultsRes = await api.get('/results/my-results');
      
      const allExams = examsRes.data || [];
      const allotted = allExams.filter(exam => exam.isAllotted === true);
      const publicOnly = allExams.filter(exam => exam.isPublic === true && !exam.isAllotted);
      
      setExams(allExams);
      setAllottedExams(allotted);
      setPublicExams(publicOnly);
      setResults(resultsRes.data || []);
      
      if (allExams.length === 0) {
        toast('No exams available. Contact admin for exam allotment.', { icon: '📚' });
      }
    } catch (error) {
      console.error('Fetch error:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to fetch data. Please refresh the page.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getFilteredExams = () => {
    if (activeTab === 'allotted') return allottedExams;
    if (activeTab === 'public') return publicExams;
    return exams;
  };

  const filteredExams = getFilteredExams();

  const performanceData = results.map(r => ({
    name: r.examTitle?.substring(0, 15) || 'Exam',
    score: r.percentage
  }));

  const averageScore = results.length > 0 
    ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length 
    : 0;

  const bestScore = results.length > 0 
    ? Math.max(...results.map(r => r.percentage)) 
    : 0;

  const pieData = [
    { name: 'Completed', value: results.length },
    { name: 'Allotted Pending', value: allottedExams.filter(e => !e.hasTaken).length },
    { name: 'Public Pending', value: publicExams.filter(e => !e.hasTaken).length }
  ];

  const COLORS = ['#10B981', '#4F46E5', '#9CA3AF'];

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
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name || 'Student'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {allottedExams.length > 0 
              ? `You have ${allottedExams.length} exam(s) allotted to you.`
              : 'No exams allotted yet. Contact your admin for exam access.'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Allotted</p>
                <p className="text-3xl font-bold text-indigo-600">{allottedExams.length}</p>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-900/50 rounded-full p-3">
                <FiUserCheck className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Public</p>
                <p className="text-3xl font-bold text-green-600">{publicExams.length}</p>
              </div>
              <div className="bg-green-100 dark:bg-green-900/50 rounded-full p-3">
                <FiBookOpen className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Completed</p>
                <p className="text-3xl font-bold text-blue-600">{results.length}</p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900/50 rounded-full p-3">
                <FiTrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Avg Score</p>
                <p className="text-3xl font-bold text-yellow-600">{averageScore.toFixed(1)}%</p>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/50 rounded-full p-3">
                <FiAward className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        {results.length > 0 && (
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Performance Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#4F46E5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Exam Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
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
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'all'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              All Exams ({exams.length})
            </button>
            <button
              onClick={() => setActiveTab('allotted')}
              className={`pb-3 px-1 font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'allotted'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <FiUserCheck size={16} />
              Allotted ({allottedExams.length})
            </button>
            <button
              onClick={() => setActiveTab('public')}
              className={`pb-3 px-1 font-medium transition-colors ${
                activeTab === 'public'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Public ({publicExams.length})
            </button>
          </nav>
        </div>

        {/* Exam Cards */}
        {filteredExams.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
            <FiBarChart2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              {activeTab === 'allotted' ? 'No Allotted Exams' : 
               activeTab === 'public' ? 'No Public Exams' : 'No Exams Available'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              {activeTab === 'allotted' 
                ? 'Your admin hasn\'t allotted any exams to you yet.'
                : activeTab === 'public'
                ? 'There are no public exams available at the moment.'
                : 'No exams are available right now. Check back later.'}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => (
              <ExamCard key={exam._id} exam={exam} />
            ))}
          </div>
        )}

        {/* Recent Results */}
        {results.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Recent Results</h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Exam</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Percentage</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {results.slice(0, 5).map((result, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{result.examTitle}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{result.score}/{result.totalMarks}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full">
                              <div className="h-2 bg-indigo-600 rounded-full" style={{ width: `${result.percentage}%` }}></div>
                            </div>
                            <span className="text-sm text-gray-900 dark:text-white">{result.percentage.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(result.submittedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;