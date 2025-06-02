import React, { useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

const ItemFormModal = ({ 
  show, 
  onClose, 
  onSubmit, 
  formData: initialFormData, 
  loading, 
  formMode, 
  categories,
  validationSchema
}) => {
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: yupResolver(validationSchema),
    defaultValues: initialFormData
  });
  
  // Update form when initialFormData changes
  useEffect(() => {
    reset(initialFormData);
    Object.entries(initialFormData).forEach(([key, value]) => {
      setValue(key, value);
    });
  }, [initialFormData, reset, setValue]);

  const submitHandler = (data) => {
    if (typeof onSubmit === 'function') {
      onSubmit(data);
    }
  };

  // Close modal when clicking outside
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center z-50"
          onClick={handleBackdropClick}
          style={{
            backdropFilter: 'blur(4px)',
            backgroundColor: 'rgba(0, 0, 0, 0.4)'
          }}
        >
          {/* Modal Content - Wider with 2 columns */}
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ 
              type: "spring", 
              duration: 0.3,
              bounce: 0.2
            }}
            className="bg-white rounded-lg p-6 md:p-8 max-w-4xl w-[95%] lg:w-3/4 xl:w-2/3 shadow-xl border border-gray-200"
            onClick={e => e.stopPropagation()} // Prevent clicks from bubbling up
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-800 pb-2 border-b border-gray-200">
              {formMode === 'create' ? 'Add New Item' : 'Edit Item'}
            </h2>

            <form onSubmit={handleSubmit(submitHandler)}>
              {/* Two-column layout for the entire form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                {/* Left Column */}
                <div>
                  <div className="mb-5">
                    <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category_id"
                      {...register("category_id")}
                      className={`w-full rounded-md text-base py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.category_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.category_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.category_id.message}</p>
                    )}
                  </div>

                  <div className="mb-5">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Item Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      {...register("name")}
                      className={`w-full rounded-md text-base py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  <div className="mb-5">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      id="description"
                      {...register("description")}
                      rows="3"
                      className="w-full rounded-md text-base border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    ></textarea>
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        id="quantity"
                        {...register("quantity")}
                        min="0"
                        className={`w-full rounded-md text-base py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          errors.quantity ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.quantity && (
                        <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                        Unit <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="unit"
                        {...register("unit")}
                        placeholder="pcs, boxes, etc."
                        className={`w-full rounded-md text-base py-2 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          errors.unit ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.unit && (
                        <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div>
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        id="price"
                        {...register("price")}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        className={`w-full rounded-md text-base py-2 border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          errors.price ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.price && (
                        <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        id="location"
                        {...register("location")}
                        placeholder="Storage location"
                        className={`w-full rounded-md text-base py-2 border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          errors.location ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.location && (
                        <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div>
                      <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
                        Condition
                      </label>
                      <input
                        type="text"
                        id="condition"
                        {...register("condition")}
                        placeholder="New, Used, etc."
                        className={`w-full rounded-md text-base py-2 border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          errors.condition ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.condition && (
                        <p className="mt-1 text-sm text-red-600">{errors.condition.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        id="expiry_date"
                        {...register("expiry_date")}
                        className={`w-full rounded-md text-base py-2 border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          errors.expiry_date ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.expiry_date && (
                        <p className="mt-1 text-sm text-red-600">{errors.expiry_date.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="mb-5">
                    <label htmlFor="qr_code" className="block text-sm font-medium text-gray-700 mb-1">
                      QR Code
                    </label>
                    <input
                      type="text"
                      id="qr_code"
                      {...register("qr_code")}
                      placeholder="Unique QR code value"
                      className={`w-full rounded-md text-base py-2 border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        errors.qr_code ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Leave blank to auto-generate or scan a QR code
                    </p>
                    {errors.qr_code && (
                      <p className="mt-1 text-sm text-red-600">{errors.qr_code.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Buttons - Full width at the bottom */}
              <div className="flex justify-end space-x-4 mt-7 pt-4 border-t border-gray-200">
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-base bg-gray-200 hover:bg-gray-300 rounded-md transition-colors duration-200"
                  whileHover={{ backgroundColor: "#d1d5db" }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 text-base bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:bg-blue-300 transition-colors duration-200"
                  whileHover={{ backgroundColor: "#2563eb" }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? 'Saving...' : 'Save Item'}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ItemFormModal;