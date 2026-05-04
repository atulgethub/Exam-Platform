import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/axiosConfig';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('Attempting login for:', email);
      
      const response = await api.post('/auth/login', {
        email,
        password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role
        }));
        
        toast.success(`Welcome back, ${response.data.name}!`);
        
        setTimeout(() => {
          const userRole = response.data.role;
          if (userRole === 'admin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }, 500);
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Please make sure the backend is running on port 5000');
      } else if (error.response?.status === 401) {
        toast.error('Invalid email or password');
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Demo credentials helper
  const fillDemoCredentials = (type) => {
    if (type === 'admin') {
      setEmail('admin@exam.com');
      setPassword('Admin123!');
    } else {
      setEmail('student@example.com');
      setPassword('Student123!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Login to your account</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                required
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10 pr-10"
                required
                placeholder="Enter your password"
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
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 py-3"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        {/* Demo Credentials Buttons */}
        <div className="mt-6 space-y-2">
          <p className="text-sm text-gray-600 text-center">Demo Accounts:</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fillDemoCredentials('admin')}
              className="flex-1 text-sm bg-indigo-50 text-indigo-600 py-2 rounded-lg hover:bg-indigo-100 transition"
            >
              Admin Demo
            </button>
            <button
              type="button"
              onClick={() => fillDemoCredentials('student')}
              className="flex-1 text-sm bg-green-50 text-green-600 py-2 rounded-lg hover:bg-green-100 transition"
            >
              Student Demo
            </button>
          </div>
        </div>
        
        <p className="text-center mt-6 text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 hover:underline font-semibold">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;