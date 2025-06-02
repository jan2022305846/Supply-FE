import React from 'react';
import { Bar, Pie } from 'react-chartjs-2';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { cardVariants, containerVariants } from '../../AnimationVariants';

// Chart components to memoize rendering
export const RequestChart = React.memo(({ data }) => (
  <Pie data={data} options={{ maintainAspectRatio: false }} />
));

export const ActivityChart = React.memo(({ data }) => (
  <Bar 
    data={data} 
    options={{ 
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }} 
  />
));

export const CategoryChart = React.memo(({ data }) => (
  <Bar 
    data={data} 
    options={{ 
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      }
    }} 
  />
));

// Chart Section Component
export const ChartSection = ({ loading, requestStats, activityStats, requestChartData, activityChartData }) => (
  <motion.div 
    className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
    variants={containerVariants}
  >
    <motion.div variants={cardVariants}>
      <h3 className="text-lg font-medium mb-4">Request Status Distribution</h3>
      <div className="h-64 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : Object.keys(requestStats).length > 0 ? (
          <RequestChart data={requestChartData} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">No request data available</div>
        )}
      </div>
    </motion.div>
    
    <motion.div variants={cardVariants}>
      <h3 className="text-lg font-medium mb-4">Activities by Type</h3>
      <div className="h-64 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : Object.keys(activityStats).length > 0 ? (
          <ActivityChart data={activityChartData} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">No activity data available</div>
        )}
      </div>
    </motion.div>
  </motion.div>
);

// Category Chart Component
export const CategoryChartSection = ({ loading, itemStats, categoryChartData }) => (
  <motion.div className="mb-8" variants={cardVariants}>
    <h3 className="text-lg font-medium mb-4">Items by Category</h3>
    <div className="h-64 relative">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : Object.keys(itemStats.byCategory).length > 0 ? (
        <CategoryChart data={categoryChartData} />
      ) : (
        <div className="h-full flex items-center justify-center text-gray-500">No category data available</div>
      )}
    </div>
  </motion.div>
);