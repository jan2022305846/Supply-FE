import React, { useState, useCallback, useEffect } from 'react';
import { itemService, categoryService, logService } from '../../services/api';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ArrowPathIcon, 
  FunnelIcon, 
  BellIcon, 
  ClockIcon,
  ArchiveBoxIcon,
  ArrowUturnLeftIcon
} from '@heroicons/react/24/outline';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import ItemFormModal from '../../components/admin/items/ItemForm';
import DeleteConfirmationModal from '../../components/admin/items/DeleteItem';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as yup from 'yup';

const ItemManagement = () => {
  // Query client
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [viewMode, setViewMode] = useState('all'); // all, lowStock, expiring, trash
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [refreshing, setRefreshing] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [formMode, setFormMode] = useState('create');
  const [processingItemIds, setProcessingItemIds] = useState([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // React Query hooks for data fetching
  const fetchItems = useCallback(async () => {
    setRefreshing(true);
    try {
      let response;
      switch (viewMode) {
        case 'lowStock':
          response = await itemService.getLowStock(currentPage, pageSize);
          break;
        case 'expiring':
          response = await itemService.getExpiringSoon(currentPage, pageSize);
          break;
        case 'trash':
          response = await itemService.getTrashed(currentPage, pageSize);
          break;
        default:
          response = await itemService.getAll(currentPage, pageSize);
      }
      
      // Store pagination metadata
      if (response.data) {
        setTotalItems(response.data.total || 0);
        setTotalPages(response.data.last_page || 1);
      }
      
      setTimeout(() => setRefreshing(false), 500);
      return response.data.data || []; // Return only the data array
    } catch (err) {
      setTimeout(() => setRefreshing(false), 500);
      throw new Error(err.response?.data?.message || err.message);
    }
  }, [viewMode, currentPage, pageSize]);

  const { data: items = [], error, isLoading, refetch } = useQuery({
    queryKey: ['items', viewMode, currentPage, pageSize],
    queryFn: fetchItems,
    placeholderData: previousData => previousData,
    staleTime: 5 * 60 * 1000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await categoryService.getAll();
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  
  // Validation schema
  const validationSchema = yup.object().shape({
    name: yup.string().required('Item name is required'),
    category_id: yup.string().required('Category is required'),
    quantity: yup.number().min(0, 'Quantity cannot be negative').required('Quantity is required'),
    unit: yup.string().required('Unit is required'),
    price: yup.number().nullable().transform((v) => (isNaN(v) ? null : v)),
    qr_code: yup.string().nullable(),
    expiry_date: yup.date().nullable().transform((v) => (v === '' ? null : v)),
  });

  // Initial form data
  const initialFormData = {
    category_id: categories.length > 0 ? categories[0].id : '',
    name: '',
    description: '',
    quantity: 0,
    price: '',
    unit: '',
    location: '',
    condition: '',
    qr_code: '',
    expiry_date: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    setCurrentPage(1);
  }, [viewMode, searchTerm, filterCategory]);

  // Mutations for CRUD operations
  const createItemMutation = useMutation({
    mutationFn: (data) => itemService.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      logService.create({
        action: 'create',
        description: `Created new item: ${response.data.name} (${response.data.quantity} ${response.data.unit})`
      });
      closeModal();
    },
    onError: (error) => {
      console.error('Error creating item:', error);
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }) => itemService.update(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      logService.create({
        action: 'update',
        description: `Updated item: ${response.data.name} (${response.data.quantity} ${response.data.unit})`
      });
      closeModal();
    },
    onError: (error) => {
      console.error('Error updating item:', error);
    }
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id) => itemService.delete(id),
    onMutate: (id) => {
      setProcessingItemIds((prev) => [...prev, id]);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      const item = items.find(item => item.id === id);
      if (item) {
        logService.create({
          action: 'delete',
          description: `Deleted item: ${item.name}`
        });
      }
    },
    onError: (error) => {
      console.error('Error deleting item:', error);
    },
    onSettled: (_, __, id) => {
      setProcessingItemIds((prev) => prev.filter(itemId => itemId !== id));
    }
  });

  const restoreItemMutation = useMutation({
    mutationFn: (id) => itemService.restore(id),
    onMutate: (id) => {
      setProcessingItemIds((prev) => [...prev, id]);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      const item = items.find(item => item.id === id);
      if (item) {
        logService.create({
          action: 'restore',
          description: `Restored item: ${item.name}`
        });
      }
    },
    onError: (error) => {
      console.error('Error restoring item:', error);
    },
    onSettled: (_, __, id) => {
      setProcessingItemIds((prev) => prev.filter(itemId => itemId !== id));
    }
  });

  // Modal handlers
  const handleInputChange = (updatedFormData) => {
    setFormData(updatedFormData);
  };

  const openCreateModal = () => {
    setFormMode('create');
    setFormData({
      ...initialFormData,
      category_id: categories.length > 0 ? categories[0].id : '',
    });
    setShowItemModal(true);
  };

  const openEditModal = (item) => {
    setFormMode('edit');
    setCurrentItem(item);
    setFormData({
      category_id: item.category_id,
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      price: item.price || '',
      unit: item.unit || '',
      location: item.location || '',
      condition: item.condition || '',
      qr_code: item.qr_code || '',
      expiry_date: item.expiry_date ? item.expiry_date.split('T')[0] : '',
    });
    setShowItemModal(true);
  };

  const openDeleteModal = (item) => {
    setCurrentItem(item);
    setShowDeleteModal(true);
  };

  const closeModal = () => {
    setShowItemModal(false);
    setShowDeleteModal(false);
    setCurrentItem(null);
  };

  const handleSubmit = async (submittedFormData) => {
    try {
      // Validate form data
      await validationSchema.validate(submittedFormData, { abortEarly: false });
      
      // Format the expiry_date correctly for MySQL if it exists
      const formattedData = {...submittedFormData};
      
      // Format date in 'YYYY-MM-DD' format if present
      if (formattedData.expiry_date) {
        // Check if it's already an ISO string (with T)
        if (typeof formattedData.expiry_date === 'string' && formattedData.expiry_date.includes('T')) {
          // Just take the date part before T 
          formattedData.expiry_date = formattedData.expiry_date.split('T')[0];
        } else if (formattedData.expiry_date instanceof Date) {
          // Format Date object to YYYY-MM-DD
          const d = formattedData.expiry_date;
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          formattedData.expiry_date = `${year}-${month}-${day}`;
        }
      }
      
      if (formMode === 'create') {
        createItemMutation.mutate(formattedData);
      } else {
        updateItemMutation.mutate({
          id: currentItem.id,
          data: formattedData
        });
      }
    } catch (validationError) {
      // Handle validation errors
      const errors = validationError.inner.reduce((acc, error) => {
        acc[error.path] = error.message;
        return acc;
      }, {});
      
      console.error('Validation errors:', errors);
      return { errors };
    }
  };

  const handleDelete = async () => {
    if (!currentItem) return;
    closeModal();
    deleteItemMutation.mutate(currentItem.id);
  };

  const handleRestore = async (id) => {
    restoreItemMutation.mutate(id);
  };

  // Sort and filter
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      (item.name?.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.qr_code && item.qr_code.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory ? item.category_id.toString() === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  // Sort items
  const sortedItems = [...filteredItems].sort((a, b) => {
    let fieldA = a[sortField];
    let fieldB = b[sortField];
    
    // Special handling for category field
    if (sortField === 'category') {
      fieldA = a.category?.name || '';
      fieldB = b.category?.name || '';
    }
    
    if (sortField === 'expiry_date') {
      return sortDirection === 'asc'
        ? new Date(fieldA || '9999-12-31') - new Date(fieldB || '9999-12-31')
        : new Date(fieldB || '9999-12-31') - new Date(fieldA || '9999-12-31');
    }
    
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return sortDirection === 'asc' 
        ? fieldA.localeCompare(fieldB)
        : fieldB.localeCompare(fieldA);
    }
    
    // For numeric fields
    return sortDirection === 'asc' 
      ? fieldA - fieldB
      : fieldB - fieldA;
  });

  // Loading and error states
  const isSubmitting = createItemMutation.isLoading || updateItemMutation.isLoading;
  const mutationError = createItemMutation.error || updateItemMutation.error || deleteItemMutation.error;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {viewMode === 'trash' ? 'Deleted Items' : 'Inventory Management'}
          </h1>
          <motion.button 
            onClick={() => refetch()}
            className="ml-3 p-1 rounded hover:bg-gray-100" 
            title="Refresh data"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            animate={refreshing ? { rotate: 360 } : {}}
            transition={{ duration: 0.5 }}
          >
            <ArrowPathIcon className={`h-5 w-5 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
        {viewMode !== 'trash' && (
          <motion.button
            onClick={openCreateModal}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Add New Item
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {(error || mutationError) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" 
            role="alert"
          >
            <div className="flex justify-between">
              <p>{error?.message || mutationError?.response?.data?.message || 'An error occurred'}</p>
              <button 
                onClick={() => { 
                  createItemMutation.reset();
                  updateItemMutation.reset();
                  deleteItemMutation.reset();
                }} 
                className="text-red-700 hover:text-red-900"
              >
                &times;
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View filters */}
      <div className="flex flex-wrap mb-4 gap-2">
        <button
          onClick={() => setViewMode('all')}
          className={`px-4 py-2 rounded-md ${
            viewMode === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Items
        </button>
        <button
          onClick={() => setViewMode('lowStock')}
          className={`px-4 py-2 rounded-md flex items-center ${
            viewMode === 'lowStock' 
              ? 'bg-red-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <BellIcon className="w-4 h-4 mr-1" />
          Low Stock
        </button>
        <button
          onClick={() => setViewMode('expiring')}
          className={`px-4 py-2 rounded-md flex items-center ${
            viewMode === 'expiring' 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <ClockIcon className="w-4 h-4 mr-1" />
          Expiring Soon
        </button>
        <button
          onClick={() => setViewMode('trash')}
          className={`px-4 py-2 rounded-md flex items-center ${
            viewMode === 'trash' 
              ? 'bg-gray-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <ArchiveBoxIcon className="w-4 h-4 mr-1" />
          Trash
        </button>
      </div>

      {/* Search and filter controls */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-4"
      >
        <div className="flex-grow relative">
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              &times;
            </button>
          )}
        </div>
        <div className="w-full md:w-1/3">
          <div className="relative">
            <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 appearance-none"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {isLoading && items.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"
          ></motion.div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="bg-white shadow-md rounded-lg overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('name')}
                  >
                    Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('category')}
                  >
                    Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSort('quantity')}
                  >
                    Quantity {sortField === 'quantity' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                    onClick={() => toggleSort('location')}
                  >
                    Location {sortField === 'location' && (sortDirection === 'asc' ? '↑' : '↓')}
                  </th>
                  {(viewMode === 'expiring' || sortField === 'expiry_date') && (
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hidden md:table-cell"
                      onClick={() => toggleSort('expiry_date')}
                    >
                      Expires {sortField === 'expiry_date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </th>
                  )}
                  {viewMode === 'trash' && (
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell"
                    >
                      Deleted At
                    </th>
                  )}
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <AnimatePresence>
                  {sortedItems.map((item) => (
                    <motion.tr 
                      key={item.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: processingItemIds.includes(item.id) ? 0.5 : 1 }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        {item.qr_code && (
                          <div className="text-xs text-gray-500">{item.qr_code}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{item.category?.name || 'Uncategorized'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${item.quantity <= 5 ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {item.quantity} {item.unit}
                          {item.price && (
                            <div className="text-xs text-gray-500">₱{parseFloat(item.price).toFixed(2)}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-gray-500">
                          {item.location || 'Not specified'}
                          {item.condition && (
                            <div className="text-xs text-gray-500">Condition: {item.condition}</div>
                          )}
                        </div>
                      </td>
                      {(viewMode === 'expiring' || sortField === 'expiry_date') && item.expiry_date && (
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className={`text-sm ${
                            new Date(item.expiry_date) <= new Date(new Date().setDate(new Date().getDate() + 7)) 
                              ? 'text-red-600 font-medium' 
                              : 'text-orange-500'
                          }`}>
                            {new Date(item.expiry_date).toLocaleDateString()}
                          </div>
                        </td>
                      )}
                      {viewMode === 'trash' && (
                        <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                          <div className="text-sm text-gray-500">
                            {new Date(item.deleted_at).toLocaleString()}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {viewMode !== 'trash' ? (
                          <>
                            <motion.button
                              onClick={() => openEditModal(item)}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              disabled={processingItemIds.includes(item.id)}
                            >
                              <PencilIcon className="w-5 h-5 inline" />
                            </motion.button>
                            <motion.button
                              onClick={() => openDeleteModal(item)}
                              className="text-red-600 hover:text-red-900"
                              whileHover={{ scale: 1.2 }}
                              whileTap={{ scale: 0.9 }}
                              disabled={processingItemIds.includes(item.id)}
                            >
                              <TrashIcon className="w-5 h-5 inline" />
                            </motion.button>
                          </>
                        ) : (
                          <motion.button
                            onClick={() => handleRestore(item.id)}
                            className="text-green-600 hover:text-green-900"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={processingItemIds.includes(item.id)}
                          >
                            <ArrowUturnLeftIcon className="w-5 h-5 inline" />
                            <span className="ml-1">Restore</span>
                          </motion.button>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>

                {filteredItems.length === 0 && (
                  <tr>
                    <td 
                      colSpan={viewMode === 'trash' ? 6 : viewMode === 'expiring' ? 5 : 4} 
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      {items.length === 0 ? (
                        viewMode === 'lowStock' 
                          ? "No items with low stock" 
                          : viewMode === 'expiring'
                            ? "No items expiring soon"
                            : viewMode === 'trash'
                              ? "No deleted items"
                              : "No items found"
                      ) : "No items match your search"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
              {!isLoading && items.length > 0 && (
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                        ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => prev < totalPages ? prev + 1 : prev)}
                      disabled={currentPage >= totalPages}
                      className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md 
                        ${currentPage >= totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{items.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0}</span> to{' '}
                        <span className="font-medium">{Math.min(currentPage * pageSize, totalItems)}</span> of{' '}
                        <span className="font-medium">{totalItems}</span> results
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select 
                        value={pageSize} 
                        onChange={e => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      >
                        <option value={5}>5 per page</option>
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                      </select>
                      
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        {/* First page button */}
                        <button
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 
                            ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                        >
                          <span className="sr-only">First</span>
                          &laquo;
                        </button>
                        
                        {/* Previous button */}
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          className={`relative inline-flex items-center px-2 py-2 border border-gray-300 
                            ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                        >
                          <span className="sr-only">Previous</span>
                          &lsaquo;
                        </button>
                        
                        {/* Page numbers */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // Calculate page numbers to show
                          let pageNumbers = [];
                          
                          if (totalPages <= 5) {
                            // If 5 or fewer pages, show all pages
                            pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
                          } else if (currentPage <= 3) {
                            // Near the start
                            pageNumbers = [1, 2, 3, 4, 5];
                          } else if (currentPage >= totalPages - 2) {
                            // Near the end
                            pageNumbers = Array.from({ length: 5 }, (_, i) => totalPages - 4 + i);
                          } else {
                            // In the middle
                            pageNumbers = [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
                          }
                          
                          const pageNum = pageNumbers[i];
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              aria-current={currentPage === pageNum ? "page" : undefined}
                              className={`relative inline-flex items-center px-4 py-2 border ${
                                currentPage === pageNum
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              } text-sm font-medium`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        
                        {/* Next button */}
                        <button
                          onClick={() => setCurrentPage(prev => prev < totalPages ? prev + 1 : prev)}
                          disabled={currentPage >= totalPages}
                          className={`relative inline-flex items-center px-2 py-2 border border-gray-300 
                            ${currentPage >= totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                        >
                          <span className="sr-only">Next</span>
                          &rsaquo;
                        </button>
                        
                        {/* Last page button */}
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage >= totalPages}
                          className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 
                            ${currentPage >= totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                        >
                          <span className="sr-only">Last</span>
                          &raquo;
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
          </div>
        </motion.div>
      )}

      {/* Render modals using imported components */}
      <ItemFormModal
        show={showItemModal}
        onClose={closeModal}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleInputChange}
        loading={isSubmitting}
        formMode={formMode}
        categories={categories}
        validationSchema={validationSchema}
      />

      <DeleteConfirmationModal
        show={showDeleteModal}
        onClose={closeModal}
        onDelete={handleDelete}
        loading={deleteItemMutation.isLoading}
        itemName={currentItem?.name}
      />
    </div>
  );
};

export default ItemManagement;