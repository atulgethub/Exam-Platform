import React, { useEffect } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

const ProctoringWarning = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-20 right-4 left-4 sm:left-auto sm:right-4 z-50 animate-bounce-slow">
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-xl p-4 max-w-md mx-auto sm:mx-0">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <FiAlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm sm:text-base">Proctoring Alert</p>
            <p className="text-sm opacity-95">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-white hover:text-gray-200 text-xl"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProctoringWarning;