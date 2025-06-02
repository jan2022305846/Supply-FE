import React, { useState, useEffect, useCallback } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { logService, requestService, itemService } from '../../services/api';

// Import components
import ErrorAlert from '../../components/ErrorAlert';
import StatCards from '../../components/admin/reports/StatCards';
import { ChartSection, CategoryChartSection } from '../../components/admin/reports/Chart';
import ActivityLogsTable from '../../components/admin/reports/ActivityLogsTable';
import LowStockTable from '../../components/admin/reports/LowStockTable';
import ReportHeader from '../../components/admin/reports/ReportHeader';

// Import animation variants
import { cardVariants, containerVariants } from '../../components/AnimationVariants';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  PointElement, 
  LineElement,
  Title, 
  Tooltip, 
  Legend
);

const ReportPage = () => {
  const [logs, setLogs] = useState([]);
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportType, setReportType] = useState('monthly');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)).toISOString().split('T')[0], // First day of current month
    end: new Date().toISOString().split('T')[0] // Today
  });

  // Stats
  const [requestStats, setRequestStats] = useState({});
  const [activityStats, setActivityStats] = useState({});
  const [itemStats, setItemStats] = useState({
    totalItems: 0,
    lowStock: [],
    byCategory: {}
  });

  // Data fetching function wrapped in useCallback to fix the dependency warning
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all required data
      const [logsResponse, requestsResponse, itemsResponse] = await Promise.all([
        logService.getAll(),
        requestService.getAll(),
        itemService.getAll()
      ]);

      setLogs(logsResponse.data);
      setRequests(requestsResponse.data);
      setItems(itemsResponse.data);

      // Process data for reports
      processRequestStats(requestsResponse.data);
      processActivityStats(logsResponse.data);
      processItemStats(itemsResponse.data);

      setError(null);
    } catch (err) {
      setError('Failed to fetch report data: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  }, []);  // Empty dependency array because it doesn't depend on props or state

  useEffect(() => {
    fetchData();
  }, [dateRange, fetchData]);  // Added fetchData to the dependency array

  const processRequestStats = (requests) => {
    // Count requests by status
    const statuses = {};
    requests.forEach(request => {
      statuses[request.status] = (statuses[request.status] || 0) + 1;
    });
    setRequestStats(statuses);
  };

  const processActivityStats = (logs) => {
    // Count activities by type
    const activities = {};
    logs.forEach(log => {
      activities[log.action] = (activities[log.action] || 0) + 1;
    });
    setActivityStats(activities);
  };

  const processItemStats = (items) => {
    // Process items by category and identify low stock
    const byCategory = {};
    const lowStock = items.filter(item => item.quantity <= 5);
    
    items.forEach(item => {
      const categoryName = item.category?.name || 'Uncategorized';
      if (!byCategory[categoryName]) {
        byCategory[categoryName] = 0;
      }
      byCategory[categoryName]++;
    });

    setItemStats({
      totalItems: items.length,
      lowStock,
      byCategory
    });
  };

  // Fixed the ESLint error by moving the declaration outside the case statement
  const handleReportTypeChange = (e) => {
    const type = e.target.value;
    setReportType(type);
    
    const today = new Date();
    let startDate;
    
    // Set date range based on report type
    switch(type) {
      case 'weekly':
        // Set to last 7 days
        startDate = new Date();
        startDate.setDate(today.getDate() - 7);
        break;
      case 'monthly':
        // Set to first day of current month
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'quarterly': {
        // Set to first day of current quarter - fixed the ESLint error
        const quarter = Math.floor(today.getMonth() / 3);
        startDate = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      }
      case 'annual':
        // Set to first day of current year
        startDate = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date();
        startDate.setDate(today.getDate() - 30);
    }
    
    setDateRange({
      start: startDate.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    });
  };

  // Prepare chart data
  const requestChartData = {
    labels: Object.keys(requestStats),
    datasets: [
      {
        label: 'Requests by Status',
        data: Object.values(requestStats),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)', // blue (pending)
          'rgba(75, 192, 192, 0.6)', // green (approved)
          'rgba(255, 99, 132, 0.6)', // red (declined)
          'rgba(255, 206, 86, 0.6)', // yellow (returned)
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const activityChartData = {
    labels: Object.keys(activityStats),
    datasets: [
      {
        label: 'Activities by Type',
        data: Object.values(activityStats),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const categoryChartData = {
    labels: Object.keys(itemStats.byCategory),
    datasets: [
      {
        label: 'Items by Category',
        data: Object.values(itemStats.byCategory),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Filter logs based on date range
  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.created_at);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    endDate.setHours(23, 59, 59); // End of the day
    return logDate >= startDate && logDate <= endDate;
  });

  const getReportTitle = () => {
    switch(reportType) {
      case 'weekly':
        return 'Weekly Supply Report';
      case 'monthly':
        return 'Monthly Supply Report';
      case 'quarterly':
        return 'Quarterly Supply Report';
      case 'annual':
        return 'Annual Supply Report';
      default:
        return 'Supply Report';
    }
  };

  const getDateRangeString = () => {
    return `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`;
  };

  return (
    <motion.div 
      className="container mx-auto px-4 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header Section */}
      <ReportHeader 
        reportType={reportType}
        handleReportTypeChange={handleReportTypeChange}
        getReportTitle={getReportTitle}
        getDateRangeString={getDateRangeString}
        filteredLogs={filteredLogs}
        requestStats={requestStats}
        itemStats={itemStats}
        dateRange={dateRange}
      />

      {/* Error display */}
      <AnimatePresence>
        {error && <ErrorAlert error={error} onDismiss={() => setError(null)} />}
      </AnimatePresence>
      
      {/* Main Report Card */}
      <motion.div 
        className="bg-white shadow-md rounded-lg p-6 mb-8"
        variants={cardVariants}
      >
        <h2 className="text-xl font-semibold mb-4">{getReportTitle()}</h2>
        <p className="text-gray-600 mb-4">Period: {getDateRangeString()}</p>
        
        {/* Stats Cards */}
        <StatCards 
          requests={requests}
          items={items}
          itemStats={itemStats}
        />

        {/* Charts Section */}
        <ChartSection 
          loading={loading}
          requestStats={requestStats}
          activityStats={activityStats}
          requestChartData={requestChartData}
          activityChartData={activityChartData}
        />
        
        {/* Category Chart */}
        <CategoryChartSection 
          loading={loading}
          itemStats={itemStats}
          categoryChartData={categoryChartData}
        />
        
        {/* Activity Logs Table */}
        <ActivityLogsTable 
          loading={loading}
          filteredLogs={filteredLogs}
        />
      </motion.div>
      
      {/* Low Stock Items Table */}
      <LowStockTable itemStats={itemStats} />

      {/* Refresh button */}
      <motion.button
        className="fixed bottom-8 right-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg"
        onClick={fetchData}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </motion.button>
    </motion.div>
  );
};

export default ReportPage;