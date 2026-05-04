import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WebSocketProvider } from './contexts/WebSocketContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TakeExam from './pages/TakeExam';
import AdminPanel from './pages/AdminPanel';
import MyResults from './pages/MyResults';
import ExamResults from './pages/ExamResults';

const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

const isAdmin = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user.role === 'admin';
};

const PrivateRoute = ({ children, adminOnly = false }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  if (adminOnly && !isAdmin()) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <WebSocketProvider>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Student Routes */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />
              <Route path="/take-exam/:examId" element={
                <PrivateRoute>
                  <TakeExam />
                </PrivateRoute>
              } />
              <Route path="/my-results" element={
                <PrivateRoute>
                  <MyResults />
                </PrivateRoute>
              } />
              <Route path="/exam-results/:examId" element={
                <PrivateRoute>
                  <ExamResults />
                </PrivateRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <PrivateRoute adminOnly={true}>
                  <AdminPanel />
                </PrivateRoute>
              } />
              
              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff',
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </WebSocketProvider>
    </Router>
  );
}

export default App;