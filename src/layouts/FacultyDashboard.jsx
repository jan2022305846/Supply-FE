import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/auth/AuthContext';

// Import faculty-specific pages
import BrowseItems from '../pages/faculty/BrowseItems';
import RequestItems from '../pages/faculty/RequestItems';

export default function FacultyDashboard() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Faculty Header/Navigation */}
      <nav className="bg-blue-600 text-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <h1 className="text-xl font-semibold">Supply Office</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <Link to="/faculty/dashboard" className="px-3 py-2 rounded hover:bg-blue-500">
                  Dashboard
                </Link>
                <Link to="/faculty/items" className="px-3 py-2 rounded hover:bg-blue-500">
                  Browse Items
                </Link>
                <Link to="/faculty/requests" className="px-3 py-2 rounded hover:bg-blue-500">
                  My Requests
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm">
                  {currentUser.name} ({currentUser.role})
                </span>
                <button
                  onClick={logout}
                  className="rounded-md bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-400"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Faculty Content Area */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          {/* Dashboard Overview */}
          <Route path="dashboard" element={
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-2xl font-bold mb-4">Faculty Dashboard</h2>
              <p className="text-gray-600 mb-4">
                Welcome to your dashboard. Here you can browse items, request supplies, and monitor your requests.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {/* Dashboard cards/widgets */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 hover:shadow-md transition">
                  <h3 className="font-medium text-blue-800">Browse Items</h3>
                  <p className="text-sm text-blue-700">View and request available supplies.</p>
                  <Link to="/faculty/items" className="inline-block mt-3 text-blue-600 hover:underline text-sm">Go to Items →</Link>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 hover:shadow-md transition">
                  <h3 className="font-medium text-blue-800">My Requests</h3>
                  <p className="text-sm text-blue-700">Track the status of your supply requests.</p>
                  <Link to="/faculty/requests" className="inline-block mt-3 text-blue-600 hover:underline text-sm">View Requests →</Link>
                </div>
              </div>
            </div>
          } />

          {/* Browse Items Page */}
          <Route path="items" element={<BrowseItems />} />

          {/* My Requests Page */}
          <Route path="requests" element={<RequestItems />} />

          {/* Redirect unknown paths under /faculty/* to dashboard */}
          <Route path="*" element={<Navigate to="/faculty/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
