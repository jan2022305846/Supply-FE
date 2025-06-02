import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { QrCodeIcon, UsersIcon, ArchiveBoxIcon, ClipboardDocumentIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import QRCodeScanner from './QRCodeScanner';

const Dashboard = ({ onQrScan }) => {
  const [showScanner, setShowScanner] = useState(false);

  const handleScan = (data, rawResult) => {
    if (onQrScan) {
      onQrScan(data, rawResult);
    }
    setShowScanner(false);
  };

  const navigationCards = [
    {
      title: "Manage Users",
      description: "Add or update faculty users",
      link: "/admin/users",
      bgColor: "bg-indigo-100",
      hoverColor: "hover:bg-indigo-200",
      textColor: "text-indigo-800",
      icon: <UsersIcon className="h-12 w-12 mx-auto mb-4 text-indigo-500" />
    },
    {
      title: "Manage Supplies",
      description: "Add, edit, track inventory",
      link: "/admin/items",
      bgColor: "bg-blue-100",
      hoverColor: "hover:bg-blue-200",
      textColor: "text-blue-800",
      icon: <ArchiveBoxIcon className="h-12 w-12 mx-auto mb-4 text-blue-500" />
    },
    {
      title: "Manage Requests",
      description: "Approve or decline item requests",
      link: "/admin/requests",
      bgColor: "bg-green-100",
      hoverColor: "hover:bg-green-200",
      textColor: "text-green-800",
      icon: <ClipboardDocumentIcon className="h-12 w-12 mx-auto mb-4 text-green-500" />
    },
    {
      title: "View Reports",
      description: "Analytics and statistics",
      link: "/admin/reports",
      bgColor: "bg-purple-100",
      hoverColor: "hover:bg-purple-200",
      textColor: "text-purple-800",
      icon: <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-purple-500" />
    }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white shadow rounded-lg p-6">
        {/* Fixed header section with flex layout */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Admin Dashboard</h2>
          
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md"
          >
            <QrCodeIcon className="h-5 w-5 mr-2" />
            Open Scanner
          </button>
        </div>
        
        {/* QR Scanner modal - displayed as overlay when active */}
        {showScanner && (
          <QRCodeScanner 
            onScanSuccess={handleScan} 
            onClose={() => setShowScanner(false)}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {navigationCards.map((card, index) => (
            <Link 
              key={index}
              to={card.link} 
              className={`${card.bgColor} ${card.hoverColor} p-6 rounded-lg shadow text-center transition transform hover:scale-105 hover:shadow-md flex flex-col items-center`}
            >
              {card.icon}
              <h3 className={`text-xl font-semibold ${card.textColor} mb-2`}>{card.title}</h3>
              <p className={`${card.textColor.replace('800', '700')} text-sm`}>{card.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats Overview Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="text-blue-500 text-xl font-bold mb-1">Inventory</div>
            <div className="text-3xl font-semibold text-gray-800">...</div>
            <div className="text-sm text-blue-600 mt-2">Total items in stock</div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="text-green-500 text-xl font-bold mb-1">Requests</div>
            <div className="text-3xl font-semibold text-gray-800">...</div>
            <div className="text-sm text-green-600 mt-2">Pending requests</div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
            <div className="text-yellow-500 text-xl font-bold mb-1">Low Stock</div>
            <div className="text-3xl font-semibold text-gray-800">...</div>
            <div className="text-sm text-yellow-600 mt-2">Items needing restock</div>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
            <div className="text-indigo-500 text-xl font-bold mb-1">Users</div>
            <div className="text-3xl font-semibold text-gray-800">...</div>
            <div className="text-sm text-indigo-600 mt-2">Active accounts</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;