import React from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { fadeIn } from '../../AnimationVariants';
import ReportDocument from './PDFReport';

const ReportHeader = ({ reportType, handleReportTypeChange, getReportTitle, getDateRangeString, filteredLogs, requestStats, itemStats, dateRange }) => (
  <div className="flex justify-between items-center mb-6">
    <motion.h1 
      className="text-2xl font-bold text-gray-900"
      variants={fadeIn}
    >
      Supply Office Reports
    </motion.h1>
    
    <motion.div 
      className="flex items-center space-x-4"
      variants={fadeIn}
    >
      <div>
        <select
          value={reportType}
          onChange={handleReportTypeChange}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="annual">Annual</option>
        </select>
      </div>
      
      <PDFDownloadLink
        document={
          <ReportDocument 
            title={getReportTitle()}
            dateRange={getDateRangeString()}
            activityLogs={filteredLogs}
            requestStats={requestStats}
            itemStats={itemStats}
          />
        }
        fileName={`supply-report-${dateRange.start}-${dateRange.end}.pdf`}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
      >
        {({ loading }) => (
          <>
            {loading ? (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            {loading ? 'Generating PDF...' : 'Download PDF Report'}
          </>
        )}
      </PDFDownloadLink>
    </motion.div>
  </div>
);

export default ReportHeader;