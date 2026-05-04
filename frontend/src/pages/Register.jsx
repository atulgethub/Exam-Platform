import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiEye, FiEyeOff, FiHash } from 'react-icons/fi';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    enrollmentNo: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.name.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const { confirmPassword, ...registerData } = formData;
      const response = await api.post('/auth/register', registerData);
      
      console.log('Registration response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data));
        
        toast.success('Registration successful! Redirecting...');
        
        // Small delay to show success message
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        throw new Error('No token received from server');
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle different error responses
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        // Handle validation errors
        const errorMessages = error.response.data.errors.map(err => err.msg).join(', ');
        toast.error(errorMessages);
      } else if (error.message === 'Network Error') {
        toast.error('Network error. Please check if backend server is running.');
      } else {
        toast.error(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Create Account</h1>
          <p className="text-gray-600 mt-2">Join our secure examination platform</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field pl-10"
                required
                placeholder="John Doe"
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field pl-10"
                required
                placeholder="student@example.com"
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment Number (Optional)</label>
            <div className="relative">
              <FiHash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                name="enrollmentNo"
                value={formData.enrollmentNo}
                onChange={handleChange}
                className="input-field pl-10"
                placeholder="e.g., 2024001"
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-field pl-10 pr-10"
                required
                placeholder="Minimum 6 characters"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field pl-10 pr-10"
                required
                placeholder="Confirm your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 py-3"
          >
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        
        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline font-semibold">
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;