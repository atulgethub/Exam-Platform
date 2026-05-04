import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [cheatingAlerts, setCheatingAlerts] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    console.log('Attempting WebSocket connection to:', SOCKET_URL);
    
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
      withCredentials: true,
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected successfully');
      setIsConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      console.log('Make sure backend server is running on port 5000');
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_timeout', () => {
      console.error('WebSocket connection timeout');
    });

    newSocket.io.on("reconnect_attempt", (attempt) => {
      console.log(`Reconnection attempt ${attempt}`);
    });

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  const joinExam = (examId, userId) => {
    if (!examId || !userId) return false;
    if (socket && socket.connected) {
      socket.emit('join-exam', { examId, userId });
      return true;
    }
    console.warn('Socket not connected, cannot join exam');
    return false;
  };

  const reportCheating = (examId, userId, violationType, details = {}) => {
    if (!examId || !userId || !violationType) return false;
    if (socket && socket.connected) {
      socket.emit('cheating-attempt', { examId, userId, violationType, details });
      return true;
    }
    return false;
  };

  const leaveExam = (examId) => {
    if (!examId) return false;
    if (socket && socket.connected) {
      socket.emit('leave-exam', { examId });
      return true;
    }
    return false;
  };

  return (
    <WebSocketContext.Provider value={{
      socket,
      isConnected,
      cheatingAlerts,
      joinExam,
      reportCheating,
      leaveExam
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};