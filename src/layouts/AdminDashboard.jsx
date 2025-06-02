import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth/AuthContext';

// Import admin header
import AdminHeader from '../components/admin/dashboard/AdminHeader';

// Import admin-specific pages
import Dashboard from '../components/admin/dashboard/Dashboard';
import UserManagement from '../pages/admin/UserManagement';
import ItemManagement from '../pages/admin/ItemManagement';
import RequestManagement from '../pages/admin/RequestManagement';
import ReportPage from '../pages/admin/ReportPage';

// Import services
import { itemService } from '../services/api';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [notification, setNotification] = useState(null);

  // Handle QR scan result
  const handleQrScan = async (data) => {
    try {
      // Try to parse the QR code data (could be JSON or just an ID)
      let scannedId;
      try {
        const parsed = JSON.parse(data);
        scannedId = parsed.id || parsed.itemId || parsed;
      } catch (e) {
        console.log(e);
        scannedId = data;
      }

      // Check if it's a valid item ID
      const response = await itemService.get(scannedId);
      if (response.data) {
        // If successful, show a notification with item details
        setNotification({
          type: 'success',
          message: `Item found: ${response.data.name}`,
          details: response.data
        });
      } else {
        throw new Error('Item not found');
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setNotification({
        type: 'error',
        message: 'Could not process this QR code: ' + (error.response?.data?.message || error.message)
      });
    }

    // Clear notification after 5 seconds
    setTimeout(() => setNotification(null), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header/Navigation */}
      <AdminHeader 
        currentUser={currentUser} 
        logout={logout} 
      />

      {/* Notification Area */}
      {notification && (
        <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-4 ${
          notification.type === 'error' ? 'bg-red-100 border-l-4 border-red-500 text-red-700' :
          'bg-green-100 border-l-4 border-green-500 text-green-700'
        } p-4 rounded-md`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {notification.type === 'error' ? (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{notification.message}</p>
              {notification.details && (
                <div className="mt-2 text-sm">
                  <p>Quantity: {notification.details.quantity} {notification.details.unit}</p>
                  <p>Category: {notification.details.category?.name || 'Uncategorized'}</p>
                </div>
              )}
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={() => setNotification(null)}
                  className={`inline-flex rounded-md p-1.5 ${
                    notification.type === 'error' ? 'bg-red-50 text-red-500 hover:bg-red-100' :
                    'bg-green-50 text-green-500 hover:bg-green-100'
                  }`}
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* Dashboard with integrated QR Scanner */}
          <Route path="dashboard" element={<Dashboard onQrScan={handleQrScan} />} />

          {/* Users Management */}
          <Route path="users" element={<UserManagement />} />

          {/* Items/Supplies Management */}
          <Route path="items" element={<ItemManagement />} />

          {/* Borrow Requests Management */}
          <Route path="requests" element={<RequestManagement />} />

          {/* Reports */}
          <Route path="reports" element={<ReportPage />} />

          {/* Redirect wrong paths */}
          <Route path="*" element={<Navigate to="/admin/dashboard" />} />
        </Routes>
      </main>
    </div>
  );
}