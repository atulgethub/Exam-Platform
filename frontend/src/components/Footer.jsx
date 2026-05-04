import React, { useState } from 'react';
import { FiMail, FiMapPin, FiPhone, FiSend, FiFacebook, FiTwitter, FiLinkedin, FiGithub } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Footer = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/contact/submit', formData);
      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 gradient-text">ExamPlatform</h3>
            <p className="text-gray-400 mb-4">
              A secure online examination platform with real-time proctoring, 
              automated cheating detection, and comprehensive analytics.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-indigo-400 transition">
                <FiFacebook size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-400 transition">
                <FiTwitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-400 transition">
                <FiLinkedin size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-indigo-400 transition">
                <FiGithub size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-indigo-400 transition">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-400 hover:text-indigo-400 transition">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-400 hover:text-indigo-400 transition">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-indigo-400 transition">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3 text-gray-400">
                <FiMapPin className="text-indigo-400" />
                <span>123 Education Street, Tech City, TC 12345</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <FiPhone className="text-indigo-400" />
                <span>+1 234 567 8900</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <FiMail className="text-indigo-400" />
                <span>support@examplatform.com</span>
              </li>
            </ul>
          </div>

          {/* Contact Form */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Send us a message</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="email"
                name="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                name="subject"
                placeholder="Subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
              <textarea
                name="message"
                placeholder="Your Message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="3"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              ></textarea>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  'Sending...'
                ) : (
                  <>
                    <FiSend />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 ExamPlatform. All rights reserved. | Secure Online Examination System</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;