import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiShield, FiClock, FiBarChart2, FiUsers, FiAward, FiTrendingUp,
  FiCheckCircle, FiBookOpen, FiCode, FiUserCheck, FiZap, FiGlobe
} from 'react-icons/fi';
import Footer from '../components/Footer';

const Home = () => {
  const [stats, setStats] = useState({
    totalExams: 0,
    totalStudents: 0,
    averageScore: 0
  });

  const features = [
    {
      icon: <FiShield className="h-8 w-8" />,
      title: "Secure Proctoring",
      description: "Real-time monitoring with AI-powered cheating detection and fullscreen enforcement"
    },
    {
      icon: <FiZap className="h-8 w-8" />,
      title: "Real-time Alerts",
      description: "Instant notifications for suspicious activities with WebSocket technology"
    },
    {
      icon: <FiBookOpen className="h-8 w-8" />,
      title: "Multiple Question Types",
      description: "Support for MCQ, coding problems, and descriptive questions"
    },
    {
      icon: <FiCode className="h-8 w-8" />,
      title: "Code Editor",
      description: "Integrated Monaco editor with syntax highlighting for multiple languages"
    },
    {
      icon: <FiBarChart2 className="h-8 w-8" />,
      title: "Detailed Analytics",
      description: "Comprehensive reports and performance visualization"
    },
    {
      icon: <FiUserCheck className="h-8 w-8" />,
      title: "Automated Grading",
      description: "Instant evaluation of MCQ and automated testing for code"
    }
  ];

  const benefits = [
    { label: "Exams Conducted", value: "150+", icon: <FiBookOpen /> },
    { label: "Active Students", value: "10,000+", icon: <FiUsers /> },
    { label: "Questions Bank", value: "25,000+", icon: <FiAward /> },
    { label: "Success Rate", value: "95%", icon: <FiTrendingUp /> }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <div className="inline-flex items-center bg-indigo-100 rounded-full px-4 py-1 mb-6">
              <FiCheckCircle className="text-indigo-600 mr-2" />
              <span className="text-indigo-600 text-sm font-semibold">Trusted by 100+ Institutions</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Next-Gen{' '}
              <span className="gradient-text">Online Examination</span>
              <br />
              Platform
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Secure, AI-powered proctoring system with real-time monitoring, 
              automated grading, and comprehensive analytics for modern education.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-lg px-8 py-3">
                Get Started Free
              </Link>
              <Link to="/login" className="btn-secondary text-lg px-8 py-3">
                Login to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Stats */}
      <div className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center">
                <div className="text-indigo-600 flex justify-center mb-3">
                  {benefit.icon}
                </div>
                <div className="text-3xl font-bold text-gray-900">{benefit.value}</div>
                <div className="text-gray-600 mt-1">{benefit.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Education
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to conduct secure, professional online examinations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 group">
                <div className="text-indigo-600 mb-4 transform group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">Simple, secure, and efficient examination process</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Register Account</h3>
              <p className="text-gray-600">Create your account with email and enrollment details</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Take Exam</h3>
              <p className="text-gray-600">Enter fullscreen mode, answer questions with proctoring</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-indigo-600">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Get Results</h3>
              <p className="text-gray-600">Instant results with detailed performance analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Examination Process?
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Join thousands of institutions using our secure examination platform
          </p>
          <Link to="/register" className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition shadow-lg inline-block">
            Start Free Trial
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Home;