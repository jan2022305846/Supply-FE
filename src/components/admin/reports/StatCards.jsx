import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { cardVariants } from '../../AnimationVariants';

// Stats Cards Component
const StatCards = ({ requests, items, itemStats }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
    <motion.div 
      className="bg-blue-50 p-4 rounded-lg"
      variants={cardVariants}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <h3 className="text-lg font-medium text-blue-800 mb-2">Total Requests</h3>
      <p className="text-3xl font-bold">{requests.length}</p>
    </motion.div>
    
    <motion.div 
      className="bg-green-50 p-4 rounded-lg"
      variants={cardVariants}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <h3 className="text-lg font-medium text-green-800 mb-2">Inventory Items</h3>
      <p className="text-3xl font-bold">{items.length}</p>
    </motion.div>
    
    <motion.div 
      className="bg-yellow-50 p-4 rounded-lg"
      variants={cardVariants}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <h3 className="text-lg font-medium text-yellow-800 mb-2">Low Stock Items</h3>
      <p className="text-3xl font-bold">{itemStats.lowStock.length}</p>
    </motion.div>
  </div>
);

export default StatCards;