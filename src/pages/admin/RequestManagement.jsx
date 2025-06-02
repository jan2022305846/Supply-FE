import React, { useState, useEffect, useCallback } from 'react';
import { requestService, itemService, logService } from '../../services/api';
import { useAuth } from '../../context/auth/AuthContext';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const RequestManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusUpdateModal, setStatusUpdateModal] = useState(false);
  const [newStatus, setNewStatus] = useState('approved');
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);

  // Use useCallback to memoize the fetchRequests function
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      // If user is admin, get all requests, otherwise get only user's requests
      const response = currentUser?.role === 'admin' 
        ? await requestService.getAll() 
        : await requestService.getMyRequests();
      setRequests(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load requests. ' + (err.response?.data?.message || err.message));
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.role]); // Include dependencies that fetchRequests relies on

  // Now use fetchRequests in useEffect with proper dependency
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Fetch available items for request form
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await itemService.getAll();
        setItems(response.data);
      } catch (err) {
        console.error("Error fetching items:", err);
      }
    };
    
    fetchItems();
  }, []);

  const openStatusModal = (request) => {
    setSelectedRequest(request);
    setNewStatus('approved'); // Default to approved
    setStatusUpdateModal(true);
  };

  const closeStatusModal = () => {
    setStatusUpdateModal(false);
    setSelectedRequest(null);
  };

  const updateRequestStatus = async () => {
    if (!selectedRequest) return;
    
    try {
      await requestService.updateStatus(selectedRequest.id, newStatus);
      
      // Log the action
      await logService.create({
        action: 'update',
        description: `Updated request status to ${newStatus} for Request #${selectedRequest.id} - Item: ${selectedRequest.item.name}`
      });
      
      // Update local state
      setRequests(requests.map(req => 
        req.id === selectedRequest.id 
          ? {...req, status: newStatus} 
          : req
      ));
      
      closeStatusModal();
    } catch (err) {
      setError('Failed to update status. ' + (err.response?.data?.message || err.message));
      console.error("Error updating request status:", err);
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.target);
      const data = {
        item_id: parseInt(formData.get('item_id')),
        quantity: parseInt(formData.get('quantity'))
      };
      
      await requestService.create(data);
      
      // Log the action
      const selectedItem = items.find(item => item.id === data.item_id);
      await logService.create({
        action: 'create',
        description: `Requested ${data.quantity} units of ${selectedItem ? selectedItem.name : 'Item #' + data.item_id}`
      });
      
      // Refresh the list
      fetchRequests();
      
      // Reset form
      e.target.reset();
      
    } catch (err) {
      setError('Failed to submit request. ' + (err.response?.data?.message || err.message));
      console.error("Error submitting request:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {currentUser?.role === 'admin' ? 'Manage All Requests' : 'My Requests'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Request form (for faculty only) */}
      {currentUser?.role !== 'admin' && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Request Supplies</h2>
          <form onSubmit={submitRequest}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="item_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Item
                </label>
                <select
                  id="item_id"
                  name="item_id"
                  required
                  className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select an item</option>
                  {items.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.available} available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min="1"
                  required
                  className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Requests list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {loading && requests.length === 0 ? (
            <div className="p-8 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : requests.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  {currentUser?.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested By
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map(request => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{request.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.item?.name || 'Unknown Item'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.quantity}
                    </td>
                    {currentUser?.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.user?.name || 'Unknown User'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {currentUser?.role === 'admin' && request.status === 'pending' && (
                        <button
                          onClick={() => openStatusModal(request)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Update Status
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No requests found.
            </div>
          )}
        </div>
      </div>

      {/* Status update modal */}
      {statusUpdateModal && (
        <Modal
          isOpen={statusUpdateModal}
          onClose={closeStatusModal}
          title="Update Request Status"
        >
          <div className="p-6">
            <div className="mb-4">
              <p className="mb-2">
                <span className="font-medium">Request:</span> #{selectedRequest.id}
              </p>
              <p className="mb-2">
                <span className="font-medium">Item:</span> {selectedRequest.item?.name}
              </p>
              <p className="mb-2">
                <span className="font-medium">Quantity:</span> {selectedRequest.quantity}
              </p>
              <p className="mb-2">
                <span className="font-medium">Requested By:</span> {selectedRequest.user?.name}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
                <option value="returned">Returned</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={closeStatusModal}
                className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={updateRequestStatus}
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Update Status
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default RequestManagement;