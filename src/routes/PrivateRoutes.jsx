import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context';
import { useEffect, useRef } from 'react';

export default function ProtectedRoute({ requireAdmin = false }) {
  const { isAuthenticated, isAdmin, currentUser, loading } = useAuth();
  const location = useLocation();
  const renderCountRef = useRef(0);
  
  // Reset counter when location changes
  useEffect(() => {
    renderCountRef.current = 0;
  }, [location.pathname]);

  // Increment render count - using ref instead of state
  renderCountRef.current += 1;
  
  // Debug log only on first render
  if (renderCountRef.current === 1) {
    console.log(`Route check (${location.pathname}):`, {
      isAuthenticated,
      isAdmin,
      requireAdmin,
      userRole: currentUser?.role
    });
  }

  // Show loader while auth state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4 animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Render fallback UI for safety (in case of excessive re-renders)
  if (renderCountRef.current > 25) {
    console.warn('Excessive renders detected, rendering fallback UI');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold text-amber-600 mb-4">Page Loading Issue</h2>
          <p className="mb-4">There seems to be a problem loading this page.</p>
          <div className="flex justify-end">
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle redirects
  
  // Case 1: Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Case 2: Faculty trying to access admin routes
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/faculty/dashboard" replace />;
  }

  // All checks passed, render the requested route
  return <Outlet />;
}