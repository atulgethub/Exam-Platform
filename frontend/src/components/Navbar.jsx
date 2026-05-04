import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  FiBookOpen, FiUser, FiLogOut, FiMenu, FiX, 
  FiHome, FiGrid, FiShield, FiAward, FiBell,
  FiSun, FiMoon, FiBarChart2, FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, [location]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.user-dropdown')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/');
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  // Navigation items based on user role
  const getNavLinks = () => {
    if (!user) {
      return [
        { path: '/', label: 'Home', icon: <FiHome className="mr-2" /> }
      ];
    }
    
    if (user.role === 'admin') {
      return [
        { path: '/', label: 'Home', icon: <FiHome className="mr-2" /> },
        { path: '/admin', label: 'Admin Dashboard', icon: <FiShield className="mr-2" /> },
        { path: '/admin/exams', label: 'Manage Exams', icon: <FiFileText className="mr-2" /> },
        { path: '/admin/results', label: 'All Results', icon: <FiBarChart2 className="mr-2" /> }
      ];
    }
    
    // Student links
    return [
      { path: '/', label: 'Home', icon: <FiHome className="mr-2" /> },
      { path: '/dashboard', label: 'Dashboard', icon: <FiGrid className="mr-2" /> },
      { path: '/my-results', label: 'My Results', icon: <FiAward className="mr-2" /> }
    ];
  };

  const navLinks = getNavLinks();

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg' 
        : 'bg-white dark:bg-gray-900 shadow-md'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 group"
              onClick={() => setIsOpen(false)}
            >
              <div className="relative">
                <FiBookOpen className="h-8 w-8 text-indigo-600 dark:text-indigo-400 transform group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute -inset-1 bg-indigo-600/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                ExamPlatform
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center ${
                  isActive(link.path)
                    ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ml-2"
              aria-label="Toggle theme"
            >
              {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            
            {user ? (
              <div className="flex items-center space-x-3 ml-4">
                {/* Notification Bell */}
                <button className="relative p-2 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <FiBell size={20} />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </button>
                
                {/* User Profile Dropdown */}
                <div className="relative user-dropdown">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 px-3 py-1.5 rounded-full hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {user.name?.split(' ')[0]}
                    </span>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg z-50 border border-gray-100 dark:border-gray-700 animate-slide-up">
                      <div className="p-3">
                        <div className="flex items-center space-x-3 pb-3 border-b border-gray-100 dark:border-gray-700">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400">
                              {user.role === 'admin' ? 'Administrator' : 'Student'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="mt-2 space-y-1">
                          <Link
                            to={user.role === 'admin' ? '/admin' : '/dashboard'}
                            className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            onClick={() => setDropdownOpen(false)}
                          >
                            <FiGrid size={16} />
                            <span>Dashboard</span>
                          </Link>
                          {user.role !== 'admin' && (
                            <Link
                              to="/my-results"
                              className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              onClick={() => setDropdownOpen(false)}
                            >
                              <FiAward size={16} />
                              <span>My Results</span>
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              handleLogout();
                              setDropdownOpen(false);
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <FiLogOut size={16} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3 ml-4">
                <Link
                  to="/login"
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isOpen && (
          <div className="md:hidden animate-slide-up pb-4">
            <div className="pt-2 pb-3 space-y-1 border-t border-gray-100 dark:border-gray-800">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg font-medium transition-colors ${
                    isActive(link.path)
                      ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
              
              {user ? (
                <>
                  <div className="px-3 py-3 mt-2 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    
                    {user.role !== 'admin' && (
                      <Link
                        to="/my-results"
                        className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors mb-1"
                        onClick={() => setIsOpen(false)}
                      >
                        <FiAward size={16} />
                        <span>My Results</span>
                      </Link>
                    )}
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsOpen(false);
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg transition-colors font-medium mt-2"
                    >
                      <FiLogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="px-3 pt-4 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg font-medium transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center px-3 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;