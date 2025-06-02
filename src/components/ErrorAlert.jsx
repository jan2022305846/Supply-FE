import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';

// Error Alert Component
const ErrorAlert = ({ error, onDismiss }) => {
  if (!error) return null;
  
  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" 
      role="alert"
    >
      <div className="flex justify-between">
        <p>{error}</p>
        <button 
          onClick={onDismiss} 
          className="text-red-700 hover:text-red-900"
        >
          &times;
        </button>
      </div>
    </motion.div>
  );
};

export default ErrorAlert;