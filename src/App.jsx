import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from './context/auth/AuthContext';
import Login from './layouts/Login';
import AdminDashboard from './layouts/AdminDashboard';
import FacultyDashboard from './layouts/FacultyDashboard';
import ProtectedRoute from './routes/PrivateRoutes';
import LoadingSpinner from './components/LoadingSpinner';
// Import authService instead of direct function
import { authService } from './services/api';
// Import TanStack Query components
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Navigation event tracker component to extend session during navigation
function NavigationEvents() {
  const location = useLocation();
  
  useEffect(() => {
    // When location changes, check and potentially extend token
    const checkSession = () => {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        // Use the isTokenExpired from authService
        const isExpired = authService.isTokenExpired();
        if (!isExpired) {
          console.log(`Session check during navigation: valid (${location.pathname})`);
        } else {
          console.warn(`Session invalid during navigation to: ${location.pathname}`);
        }
      }
    };
    
    checkSession();
  }, [location.pathname]);
  
  return null;
}

export default function App() {
  const { isAuthenticated, currentUser, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        {/* Add navigation events tracker */}
        <NavigationEvents />
        
        <Routes>
          {/* Login route - redirect to appropriate dashboard if already logged in */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? 
                (currentUser?.role === 'admin' ? 
                  <Navigate to="/admin/dashboard" replace /> : 
                  <Navigate to="/faculty/dashboard" replace />
                ) : 
                <Login />
            } 
          />
          
          {/* Admin routes */}
          <Route element={<ProtectedRoute requireAdmin={true} />}>
            <Route path="/admin/*" element={<AdminDashboard />} />
          </Route>
          
          {/* Faculty routes */}
          <Route element={<ProtectedRoute requireAdmin={false} />}>
            <Route path="/faculty/*" element={<FacultyDashboard />} />
          </Route>
          
          {/* Root redirect based on auth state and role */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? 
                (currentUser?.role === 'admin' ? 
                  <Navigate to="/admin/dashboard" replace /> : 
                  <Navigate to="/faculty/dashboard" replace />
                ) : 
                <Navigate to="/login" replace />
            } 
          />
          
          {/* Catch all route redirects to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      {/* Add React Query Devtools - only in development */}
 {import.meta.env && import.meta.env.MODE === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}