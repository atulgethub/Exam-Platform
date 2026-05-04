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
    // Use environment variable for Socket URL
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    console.log('Attempting WebSocket connection to:', SOCKET_URL);
    
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      forceNew: true,
      withCredentials: true
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected successfully to:', SOCKET_URL);
      setIsConnected(true);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ WebSocket connection error:', error.message);
      console.log('Make sure backend server is running at:', SOCKET_URL);
      setIsConnected(false);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setIsConnected(false);
    });

    newSocket.on('cheating-alert', (alert) => {
      console.log('Cheating alert received:', alert);
      setCheatingAlerts(prev => [alert, ...prev.slice(0, 49)]);
    });

    return () => {
      if (newSocket.connected) {
        newSocket.disconnect();
      }
      newSocket.close();
    };
  }, []);

  const joinExam = (examId, userId) => {
    if (socket && socket.connected) {
      socket.emit('join-exam', { examId, userId });
      console.log('Joined exam room:', examId);
      return true;
    }
    console.warn('Socket not connected, cannot join exam');
    return false;
  };

  const reportCheating = (examId, userId, violationType, details) => {
    if (socket && socket.connected) {
      socket.emit('cheating-attempt', { examId, userId, violationType, details });
      console.log('Cheating reported:', violationType);
      return true;
    }
    console.warn('Socket not connected, cannot report cheating');
    return false;
  };

  return (
    <WebSocketContext.Provider value={{ 
      socket, 
      isConnected,
      cheatingAlerts, 
      joinExam, 
      reportCheating
    }}>
      {children}
    </WebSocketContext.Provider>
  );
};