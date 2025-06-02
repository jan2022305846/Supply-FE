import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const DeleteConfirmationModal = ({ show, onClose, onDelete, loading, itemName }) => {
  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={handleBackdropClick}
          style={{
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)'
          }}
        >
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ 
              type: "spring", 
              duration: 0.3,
              bounce: 0.2
            }}
            className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl border border-gray-200"
            onClick={e => e.stopPropagation()} // Prevent clicks from bubbling up
          >
            <h2 className="text-xl font-bold mb-4 text-gray-800">Confirm Deletion</h2>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete the item <span className="font-semibold text-gray-800">{itemName}</span>?
              <br />
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <motion.button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-200"
                whileHover={{ backgroundColor: "#d1d5db" }}
                whileTap={{ scale: 0.98 }}
              >
                Cancel
              </motion.button>
              <motion.button
                onClick={onDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md disabled:bg-red-300 transition-colors duration-200"
                whileHover={{ backgroundColor: "#dc2626" }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? 'Deleting...' : 'Delete'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteConfirmationModal;