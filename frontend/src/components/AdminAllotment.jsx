import React, { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import { FiUserPlus, FiUserCheck, FiX, FiUsers, FiSearch } from 'react-icons/fi';

const AdminAllotment = ({ examId, examTitle, onAllotmentChange }) => {
  const [students, setStudents] = useState([]);
  const [allottedStudents, setAllottedStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchAllottedStudents();
  }, [examId]);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/admin/students/list');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to load students');
    }
  };

  const fetchAllottedStudents = async () => {
    try {
      const response = await api.get(`/admin/exams/${examId}/allotted`);
      setAllottedStudents(response.data);
    } catch (error) {
      console.error('Error fetching allotted students:', error);
    }
  };

  const handleAllotExam = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/admin/exams/${examId}/allot`, {
        studentIds: selectedStudents
      });
      
      toast.success(`Exam allotted to ${selectedStudents.length} student(s)`);
      setSelectedStudents([]);
      setShowModal(false);
      fetchAllottedStudents();
      if (onAllotmentChange) onAllotmentChange();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to allot exam');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAllotment = async (studentId) => {
    if (!window.confirm('Remove allotment for this student? They will lose access to this exam.')) return;
    
    try {
      await api.delete(`/admin/exams/${examId}/allot/${studentId}`);
      toast.success('Allotment removed');
      fetchAllottedStudents();
      if (onAllotmentChange) onAllotmentChange();
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

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.enrollmentNo && student.enrollmentNo.includes(searchTerm))
  );

  const notAllottedStudents = filteredStudents.filter(
    student => !allottedStudents.some(allotted => allotted._id === student._id)
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <FiUsers />
            Allotted Students
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Students who can access "{examTitle}"
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <FiUserPlus />
          Allot to Students
        </button>
      </div>

      {/* Allotted Students List */}
      <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
        {allottedStudents.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No students allotted yet</p>
        ) : (
          allottedStudents.map((student) => (
            <div key={student._id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                {student.enrollmentNo && (
                  <p className="text-xs text-gray-400 mt-1">Enrollment: {student.enrollmentNo}</p>
                )}
              </div>
              <button
                onClick={() => handleRemoveAllotment(student._id)}
                className="text-red-600 hover:text-red-800 transition p-1"
                title="Remove allotment"
              >
                <FiX size={18} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Allotment Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Allot Exam to Students</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>
            
            <div className="p-4">
              {/* Search Bar */}
              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name, email or enrollment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              
              {/* Students List */}
              <div className="space-y-2 overflow-y-auto max-h-[50vh]">
                {notAllottedStudents.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    {searchTerm ? 'No students match your search' : 'All students already have this exam allotted'}
                  </p>
                ) : (
                  notAllottedStudents.map((student) => (
                    <label key={student._id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => toggleStudentSelection(student._id)}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{student.email}</p>
                        {student.enrollmentNo && (
                          <p className="text-xs text-gray-400">ID: {student.enrollmentNo}</p>
                        )}
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAllotExam}
                disabled={loading || selectedStudents.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition"
              >
                <FiUserCheck />
                {loading ? 'Allotting...' : `Allot to ${selectedStudents.length} Student(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAllotment;