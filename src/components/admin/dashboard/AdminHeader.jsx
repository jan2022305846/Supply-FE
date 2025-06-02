import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const AdminHeader = ({ currentUser, logout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  
  const links = [
    { to: "/admin/dashboard", label: "Dashboard" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/items", label: "Supplies" },
    { to: "/admin/requests", label: "Requests" },
    { to: "/admin/reports", label: "Reports" },
  ];

  return (
    <nav className="bg-indigo-700 text-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo/Title */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold">Supply Office Admin</h1>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {links.map(link => (
              <Link 
                key={link.to}
                to={link.to} 
                className="px-3 py-2 rounded hover:bg-indigo-600 transition"
              >
                {link.label}
              </Link>
            ))}
            
            {/* User Info and Logout */}
            <div className="flex items-center gap-4 ml-6 border-l pl-4 border-indigo-600">
              <span className="text-sm hidden lg:inline">
                {currentUser.name} ({currentUser.role})
              </span>
              <button
                onClick={logout}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded hover:bg-indigo-600"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on state */}
      <div className={`md:hidden ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="space-y-1 px-4 pb-3 pt-2">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className="block px-3 py-2 rounded hover:bg-indigo-600 text-base font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-indigo-600 mt-2 flex justify-between items-center">
            <span className="text-sm">{currentUser.name}</span>
            <button
              onClick={logout}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminHeader;