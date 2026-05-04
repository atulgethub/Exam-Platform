import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Add this for CORS
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`${config.method.toUpperCase()} ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status}: ${response.config.url}`);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`❌ ${error.response.status}: ${error.config?.url}`, error.response.data);
      
      if (error.response.status === 401) {
        // Don't clear token for login/register attempts
        const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                               error.config?.url?.includes('/auth/register');
        
        if (!isAuthEndpoint) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }
    } else if (error.request) {
      console.error('No response from server. Is backend running?');
    }
    return Promise.reject(error);
  }
);

export default api;