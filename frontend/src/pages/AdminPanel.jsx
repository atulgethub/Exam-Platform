import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';  // CHANGE: Import api instead of axios
import toast from 'react-hot-toast';
import { useWebSocket } from '../contexts/WebSocketContext';
import { 
  FiAlertCircle, FiDownload, FiUsers, FiFileText, FiPlus, FiEye, FiTrash2, 
  FiUserCheck, FiX, FiSearch, FiUserPlus 
} from 'react-icons/fi';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const AdminPanel = () => {
  const { cheatingAlerts } = useWebSocket();
  const navigate = useNavigate();  // ADD: For navigation
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [cheatingLogs, setCheatingLogs] = useState([]);
  const [results, setResults] = useState([]);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [messages, setMessages] = useState([]);
  
  // Allotment States
  const [allottedStudents, setAllottedStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [showAllotmentModal, setShowAllotmentModal] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [allotmentLoading, setAllotmentLoading] = useState(false);
  
  const [newExam, setNewExam] = useState({
    title: '',
    description: '',
    duration: 60,
    category: 'General',
    isPublic: false,
    mcqQuestions: [],
    codingQuestions: []
  });
  const [mcqForm, setMcqForm] = useState({ question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 });
  const [codingForm, setCodingForm] = useState({ title: '', description: '', testCases: [], marks: 10 });

  useEffect(() => {
    fetchExams();
    fetchMessages();
    fetchAllStudents();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchCheatingLogs(selectedExam._id);
      fetchResults(selectedExam._id);
      fetchAllottedStudents(selectedExam._id);
    }
  }, [selectedExam]);

  // ADD: Function to view exam results
  const viewExamResults = (examId) => {
    navigate(`/admin/exam-results/${examId}`);
  };

  // FIXED: Use api instead of axios with localhost
  const fetchExams = async () => {
    try {
      const response = await api.get('/admin/exams');
      setExams(response.data);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
      toast.error('Failed to fetch exams');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get('/contact/messages');
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages');
    }
  };

  const fetchAllStudents = async () => {
    try {
      const response = await api.get('/admin/students/list');
      setAllStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch students');
    }
  };

  const fetchAllottedStudents = async (examId) => {
    try {
      const response = await api.get(`/admin/exams/${examId}/allotted`);
      setAllottedStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch allotted students');
      setAllottedStudents([]);
    }
  };

  const fetchCheatingLogs = async (examId) => {
    try {
      const response = await api.get(`/admin/cheating-logs/${examId}`);
      setCheatingLogs(response.data);
    } catch (error) {
      toast.error('Failed to fetch cheating logs');
    }
  };

  const fetchResults = async (examId) => {
    try {
      const response = await api.get(`/admin/results/${examId}`);
      setResults(response.data);
    } catch (error) {
      toast.error('Failed to fetch results');
    }
  };

  const handleCreateExam = async () => {
    try {
      await api.post('/admin/exams', newExam);
      toast.success('Exam created successfully');
      setShowCreateExam(false);
      fetchExams();
      setNewExam({
        title: '',
        description: '',
        duration: 60,
        category: 'General',
        isPublic: false,
        mcqQuestions: [],
        codingQuestions: []
      });
    } catch (error) {
      console.error('Create exam error:', error);
      toast.error('Failed to create exam');
    }
  };

  const handleAllotExam = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setAllotmentLoading(true);
    try {
      await api.post(`/admin/exams/${selectedExam._id}/allot`, {
        studentIds: selectedStudents
      });
      
      toast.success(`Exam allotted to ${selectedStudents.length} student(s)`);
      setSelectedStudents([]);
      setShowAllotmentModal(false);
      fetchAllottedStudents(selectedExam._id);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to allot exam');
    } finally {
      setAllotmentLoading(false);
    }
  };

  const handleRemoveAllotment = async (studentId) => {
    if (!window.confirm('Remove allotment for this student? They will lose access to this exam.')) return;
    
    try {
      await api.delete(`/admin/exams/${selectedExam._id}/allot/${studentId}`);
      toast.success('Allotment removed');
      fetchAllottedStudents(selectedExam._id);
    } catch (error) {
      toast.error('Failed to remove allotment');
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const addMCQ = () => {
    if (mcqForm.question && mcqForm.options.every(opt => opt)) {
      setNewExam({
        ...newExam,
        mcqQuestions: [...newExam.mcqQuestions, mcqForm]
      });
      setMcqForm({ question: '', options: ['', '', '', ''], correctAnswer: 0, marks: 1 });
      toast.success('MCQ question added');
    } else {
      toast.error('Please fill all MCQ fields');
    }
  };

  const addCodingQuestion = () => {
    if (codingForm.title && codingForm.description) {
      setNewExam({
        ...newExam,
        codingQuestions: [...newExam.codingQuestions, codingForm]
      });
      setCodingForm({ title: '', description: '', testCases: [], marks: 10 });
      toast.success('Coding question added');
    } else {
      toast.error('Please fill all coding question fields');
    }
  };

  const exportPDF = async (examId) => {
    try {
      const response = await api.get(`/results/export-pdf/${examId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `exam-results-${examId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  const exportExcel = async (examId) => {
    try {
      const response = await api.get(`/results/export-excel/${examId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `exam-results-${examId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Excel exported successfully');
    } catch (error) {
      toast.error('Failed to export Excel');
    }
  };

  const notAllottedStudents = allStudents.filter(
    student => !allottedStudents.some(allotted => allotted._id === student._id)
  );

  const filteredStudents = notAllottedStudents.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.enrollmentNo && student.enrollmentNo.includes(searchTerm))
  );

  const chartData = results.map(r => ({
    name: r.student?.name?.substring(0, 10) || 'Unknown',
    score: r.totalScore,
    percentage: (r.totalScore / (selectedExam?.totalMarks || 1)) * 100
  }));

  const pieData = [
    { name: 'Passed (>60%)', value: results.filter(r => (r.totalScore / (selectedExam?.totalMarks || 1)) * 100 >= 60).length },
    { name: 'Failed (<60%)', value: results.filter(r => (r.totalScore / (selectedExam?.totalMarks || 1)) * 100 < 60).length }
  ];

  const COLORS = ['#10B981', '#EF4444'];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FiFileText className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-2xl font-bold gradient-text">Admin Dashboard</h1>
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
              className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Create Exam Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowCreateExam(!showCreateExam)}
            className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition font-semibold flex items-center gap-2 shadow-md"
          >
            <FiPlus />
            {showCreateExam ? 'Cancel' : 'Create New Exam'}
          </button>
        </div>

        {/* Create Exam Form (keep as is) */}
        {showCreateExam && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 animate-slide-up">
            <h2 className="text-2xl font-bold mb-4 gradient-text">Create New Exam</h2>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Exam Title"
                className="input-field"
                value={newExam.title}
                onChange={(e) => setNewExam({ ...newExam, title: e.target.value })}
              />
              <textarea
                placeholder="Description"
                className="input-field"
                rows="3"
                value={newExam.description}
                onChange={(e) => setNewExam({ ...newExam, description: e.target.value })}
              />
              <select
                className="input-field"
                value={newExam.category}
                onChange={(e) => setNewExam({ ...newExam, category: e.target.value })}
              >
                <option value="General">General</option>
                <option value="Programming">Programming</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Science">Science</option>
                <option value="English">English</option>
              </select>
              <input
                type="number"
                placeholder="Duration (minutes)"
                className="input-field"
                value={newExam.duration}
                onChange={(e) => setNewExam({ ...newExam, duration: parseInt(e.target.value) })}
              />
              
              <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newExam.isPublic}
                    onChange={(e) => setNewExam({ ...newExam, isPublic: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Make this exam public (all students can see)</span>
                </label>
              </div>
              
              {/* MCQ Section */}
              <div className="border-t pt-4">
                <h3 className="text-xl font-semibold mb-3">Add MCQ Question</h3>
                <input
                  type="text"
                  placeholder="Question"
                  className="input-field mb-2"
                  value={mcqForm.question}
                  onChange={(e) => setMcqForm({ ...mcqForm, question: e.target.value })}
                />
                {mcqForm.options.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    className="input-field mb-2"
                    value={opt}
                    onChange={(e) => {
                      const newOptions = [...mcqForm.options];
                      newOptions[idx] = e.target.value;
                      setMcqForm({ ...mcqForm, options: newOptions });
                    }}
                  />
                ))}
                <select
                  className="input-field mb-2"
                  value={mcqForm.correctAnswer}
                  onChange={(e) => setMcqForm({ ...mcqForm, correctAnswer: parseInt(e.target.value) })}
                >
                  {[0, 1, 2, 3].map(idx => (
                    <option key={idx} value={idx}>Correct Option: {String.fromCharCode(65 + idx)}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Marks"
                  className="input-field mb-2"
                  value={mcqForm.marks}
                  onChange={(e) => setMcqForm({ ...mcqForm, marks: parseInt(e.target.value) })}
                />
                <button onClick={addMCQ} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                  Add MCQ
                </button>
                <p className="text-sm text-gray-600 mt-2">📝 {newExam.mcqQuestions.length} MCQ(s) added</p>
              </div>

              {/* Coding Section */}
              <div className="border-t pt-4">
                <h3 className="text-xl font-semibold mb-3">Add Coding Question</h3>
                <input
                  type="text"
                  placeholder="Title"
                  className="input-field mb-2"
                  value={codingForm.title}
                  onChange={(e) => setCodingForm({ ...codingForm, title: e.target.value })}
                />
                <textarea
                  placeholder="Description"
                  className="input-field mb-2"
                  rows="3"
                  value={codingForm.description}
                  onChange={(e) => setCodingForm({ ...codingForm, description: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Marks"
                  className="input-field mb-2"
                  value={codingForm.marks}
                  onChange={(e) => setCodingForm({ ...codingForm, marks: parseInt(e.target.value) })}
                />
                <button onClick={addCodingQuestion} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                  Add Coding Question
                </button>
                <p className="text-sm text-gray-600 mt-2">💻 {newExam.codingQuestions.length} Coding question(s) added</p>
              </div>

              <button
                onClick={handleCreateExam}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition shadow-md"
              >
                Create Exam
              </button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Exams List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">📚 Exams</h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {exams.map(exam => (
                  <button
                    key={exam._id}
                    onClick={() => setSelectedExam(exam)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedExam?._id === exam._id
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-semibold">{exam.title}</div>
                    <div className="text-sm opacity-75">
                      {exam.isPublic ? '🌍 Public' : '🔒 Private'} | {new Date(exam.createdAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Contact Messages */}
            <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
              <h2 className="text-xl font-bold mb-4">📧 Contact Messages</h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {messages.slice(0, 10).map(msg => (
                  <div key={msg._id} className="border-l-4 border-indigo-600 bg-gray-50 p-3 rounded">
                    <p className="font-semibold">{msg.name}</p>
                    <p className="text-sm text-gray-600">{msg.subject}</p>
                    <p className="text-xs text-gray-400">{new Date(msg.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {selectedExam ? (
              <div className="space-y-6">
                {/* Exam Info Header */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selectedExam.title}</h2>
                      <p className="text-gray-500 mt-1">{selectedExam.description}</p>
                      <div className="flex gap-4 mt-3">
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded">Duration: {selectedExam.duration} min</span>
                        <span className="text-sm bg-gray-100 px-2 py-1 rounded">Total Marks: {selectedExam.totalMarks}</span>
                        <span className={`text-sm px-2 py-1 rounded ${selectedExam.isPublic ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {selectedExam.isPublic ? '🌍 Public Exam' : '🔒 Private Exam'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAllotmentModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                      <FiUserPlus />
                      Allot to Students
                    </button>
                  </div>
                </div>

                {/* Allotted Students List */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FiUserCheck />
                    Allotted Students ({allottedStudents.length})
                  </h3>
                  {allottedStudents.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No students allotted yet.</p>
                  ) : (
                    <div className="grid gap-2 max-h-64 overflow-y-auto">
                      {allottedStudents.map((student) => (
                        <div key={student._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{student.name}</p>
                            <p className="text-sm text-gray-500">{student.email}</p>
                          </div>
                          <button onClick={() => handleRemoveAllotment(student._id)} className="text-red-600">
                            <FiX size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Live Cheating Alerts */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <FiAlertCircle className="text-red-600 mr-2" />
                    Live Cheating Alerts
                  </h2>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {cheatingAlerts.map((alert, idx) => (
                      <div key={idx} className="bg-red-50 border-l-4 border-red-600 p-3 rounded">
                        <p className="font-semibold">Student ID: {alert.userId.substring(0, 8)}...</p>
                        <p className="text-sm">Violation: {alert.violationType}</p>
                        <p className="text-xs text-gray-600">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                      <FiUsers className="h-8 w-8 text-indigo-600" />
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">Total Submissions</p>
                        <p className="text-2xl font-bold">{results.length}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center">
                      <FiAlertCircle className="h-8 w-8 text-red-600" />
                      <div className="ml-3">
                        <p className="text-sm text-gray-600">Cheating Attempts</p>
                        <p className="text-2xl font-bold">{cheatingLogs.length}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Results Table with View Results Button */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">📊 Results</h2>
                    <div className="space-x-2">
                      <button onClick={() => exportPDF(selectedExam._id)} className="bg-red-600 text-white px-4 py-2 rounded-lg">PDF</button>
                      <button onClick={() => exportExcel(selectedExam._id)} className="bg-green-600 text-white px-4 py-2 rounded-lg">Excel</button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-medium">Score</th>
                          <th className="px-6 py-3 text-left text-xs font-medium">Percentage</th>
                          <th className="px-6 py-3 text-left text-xs font-medium">Submitted</th>
                          <th className="px-6 py-3 text-left text-xs font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {results.map((result, idx) => {
                          const percentage = (result.totalScore / selectedExam.totalMarks) * 100;
                          return (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-6 py-4 text-sm">{result.student?.name || 'N/A'}</td>
                              <td className="px-6 py-4 text-sm font-semibold">{result.totalScore}/{selectedExam.totalMarks}</td>
                              <td className="px-6 py-4 text-sm">{percentage.toFixed(1)}%</td>
                              <td className="px-6 py-4 text-sm">{new Date(result.submittedAt).toLocaleDateString()}</td>
                              <td className="px-6 py-4 text-sm">
                                <button onClick={() => viewExamResults(selectedExam._id)} className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                  <FiEye /> View Results
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <FiFileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700">Select an Exam</h3>
                <p className="text-gray-500 mt-2">Choose an exam from the left to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Allotment Modal */}
      {showAllotmentModal && selectedExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Allot "{selectedExam.title}" to Students</h3>
              <button onClick={() => setShowAllotmentModal(false)} className="text-gray-500"><FiX size={24} /></button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search students..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
              </div>
              <div className="space-y-2 overflow-y-auto max-h-[50vh]">
                {filteredStudents.map((student) => (
                  <label key={student._id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input type="checkbox" checked={selectedStudents.includes(student._id)} onChange={() => toggleStudentSelection(student._id)} className="w-4 h-4 text-indigo-600 rounded" />
                    <div><p className="font-medium">{student.name}</p><p className="text-sm text-gray-500">{student.email}</p></div>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-3">
              <button onClick={() => setShowAllotmentModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
              <button onClick={handleAllotExam} disabled={allotmentLoading || selectedStudents.length === 0} className="bg-indigo-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">
                <FiUserCheck /> {allotmentLoading ? 'Allotting...' : `Allot to ${selectedStudents.length}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;