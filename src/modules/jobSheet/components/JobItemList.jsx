import React, { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as Sentry from '@sentry/browser';

const JobItemList = ({ jobItems, setJobItems, jobSheetId, isVatExempt, hasInvoice, session }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newItem, setNewItem] = useState({
    itemType: 'Parts',
    description: '',
    quantity: 1,
    unitPrice: '',
    vatRate: isVatExempt ? 0 : 20
  });

  const handleInputChange = (e, isEditMode = false, editingItem = null) => {
    const { name, value } = e.target;
    
    if (isEditMode && editingItem) {
      const updatedItem = { ...editingItem, [name]: value };
      setIsEditing(updatedItem);
    } else {
      setNewItem({ ...newItem, [name]: value });
    }
  };

  const handleAddItem = async () => {
    if (!newItem.description || !newItem.unitPrice) {
      toast.error('Description and unit price are required');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/job-items', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          jobSheetId,
          itemType: newItem.itemType,
          description: newItem.description,
          quantity: parseFloat(newItem.quantity) || 1,
          unitPrice: parseFloat(newItem.unitPrice),
          vatRate: isVatExempt ? 0 : (parseFloat(newItem.vatRate) || 20)
        })
      });
      
      if (!response.ok) throw new Error('Failed to add job item');
      
      const addedItem = await response.json();
      setJobItems([...jobItems, addedItem]);
      
      // Reset form
      setNewItem({
        itemType: 'Parts',
        description: '',
        quantity: 1,
        unitPrice: '',
        vatRate: isVatExempt ? 0 : 20
      });
      
      setIsAdding(false);
      toast.success('Item added successfully');
    } catch (error) {
      console.error('Error adding job item:', error);
      Sentry.captureException(error);
      toast.error('Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = async (item) => {
    if (!isEditing.description || !isEditing.unitPrice) {
      toast.error('Description and unit price are required');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/job-items/${item.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          itemType: isEditing.itemType,
          description: isEditing.description,
          quantity: parseFloat(isEditing.quantity) || 1,
          unitPrice: parseFloat(isEditing.unitPrice),
          vatRate: isVatExempt ? 0 : (parseFloat(isEditing.vatRate) || 20)
        })
      });
      
      if (!response.ok) throw new Error('Failed to update job item');
      
      const updatedItem = await response.json();
      
      setJobItems(jobItems.map(i => i.id === item.id ? updatedItem : i));
      setIsEditing(null);
      toast.success('Item updated successfully');
    } catch (error) {
      console.error('Error updating job item:', error);
      Sentry.captureException(error);
      toast.error('Failed to update item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`/api/job-items/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete job item');
      
      setJobItems(jobItems.filter(item => item.id !== id));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting job item:', error);
      Sentry.captureException(error);
      toast.error('Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewItem({
      itemType: 'Parts',
      description: '',
      quantity: 1,
      unitPrice: '',
      vatRate: isVatExempt ? 0 : 20
    });
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-800">Job Items</h2>
        {!hasInvoice && !isAdding && (
          <button 
            onClick={() => setIsAdding(true)} 
            className="btn-primary flex items-center cursor-pointer"
          >
            <FiPlus className="mr-2" /> Add Item
          </button>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                VAT
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              {!hasInvoice && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jobItems.map(item => {
              const isEditingThisItem = isEditing && isEditing.id === item.id;
              const itemTotal = (
                parseFloat(isEditingThisItem ? isEditing.unitPrice : item.unitPrice) * 
                parseFloat(isEditingThisItem ? isEditing.quantity : item.quantity)
              ).toFixed(2);
              
              const vatAmount = isVatExempt ? 0 : (
                parseFloat(itemTotal) * 
                (parseFloat(isEditingThisItem ? isEditing.vatRate : item.vatRate) / 100)
              ).toFixed(2);
              
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {isEditingThisItem ? (
                      <select
                        name="itemType"
                        value={isEditing.itemType}
                        onChange={(e) => handleInputChange(e, true, isEditing)}
                        className="input-field py-1 px-2 text-sm"
                      >
                        <option value="Labor">Labor</option>
                        <option value="Parts">Parts</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      item.itemType
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {isEditingThisItem ? (
                      <input
                        type="text"
                        name="description"
                        value={isEditing.description}
                        onChange={(e) => handleInputChange(e, true, isEditing)}
                        className="input-field py-1 px-2 text-sm"
                      />
                    ) : (
                      item.description
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {isEditingThisItem ? (
                      <input
                        type="number"
                        name="quantity"
                        value={isEditing.quantity}
                        onChange={(e) => handleInputChange(e, true, isEditing)}
                        className="input-field py-1 px-2 text-sm w-20 text-right"
                        min="0.01"
                        step="0.01"
                      />
                    ) : (
                      parseFloat(item.quantity).toFixed(2)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {isEditingThisItem ? (
                      <input
                        type="number"
                        name="unitPrice"
                        value={isEditing.unitPrice}
                        onChange={(e) => handleInputChange(e, true, isEditing)}
                        className="input-field py-1 px-2 text-sm w-24 text-right"
                        min="0.01"
                        step="0.01"
                      />
                    ) : (
                      `£${parseFloat(item.unitPrice).toFixed(2)}`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {isEditingThisItem && !isVatExempt ? (
                      <input
                        type="number"
                        name="vatRate"
                        value={isEditing.vatRate}
                        onChange={(e) => handleInputChange(e, true, isEditing)}
                        className="input-field py-1 px-2 text-sm w-16 text-right"
                        min="0"
                        max="100"
                      />
                    ) : (
                      `${parseFloat(isVatExempt ? 0 : item.vatRate).toFixed(0)}%`
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                    £{(parseFloat(itemTotal) + parseFloat(vatAmount)).toFixed(2)}
                  </td>
                  {!hasInvoice && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {isEditingThisItem ? (
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="text-green-600 hover:text-green-900 cursor-pointer"
                            disabled={loading}
                          >
                            <FiCheck />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="text-red-600 hover:text-red-900 cursor-pointer"
                            disabled={loading}
                          >
                            <FiX />
                          </button>
                        </div>
                      ) : (
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={() => setIsEditing({...item})}
                            className="text-blue-600 hover:text-blue-900 cursor-pointer"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-600 hover:text-red-900 cursor-pointer"
                            disabled={loading}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            
            {/* Add new item row */}
            {isAdding && (
              <tr className="bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <select
                    name="itemType"
                    value={newItem.itemType}
                    onChange={handleInputChange}
                    className="input-field py-1 px-2 text-sm"
                  >
                    <option value="Labor">Labor</option>
                    <option value="Parts">Parts</option>
                    <option value="Other">Other</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <input
                    type="text"
                    name="description"
                    value={newItem.description}
                    onChange={handleInputChange}
                    placeholder="Item description"
                    className="input-field py-1 px-2 text-sm"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  <input
                    type="number"
                    name="quantity"
                    value={newItem.quantity}
                    onChange={handleInputChange}
                    className="input-field py-1 px-2 text-sm w-20 text-right"
                    min="0.01"
                    step="0.01"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  <input
                    type="number"
                    name="unitPrice"
                    value={newItem.unitPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="input-field py-1 px-2 text-sm w-24 text-right"
                    min="0.01"
                    step="0.01"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {isVatExempt ? (
                    '0%'
                  ) : (
                    <input
                      type="number"
                      name="vatRate"
                      value={newItem.vatRate}
                      onChange={handleInputChange}
                      className="input-field py-1 px-2 text-sm w-16 text-right"
                      min="0"
                      max="100"
                    />
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  £{(
                    (parseFloat(newItem.unitPrice) || 0) * 
                    (parseFloat(newItem.quantity) || 0) * 
                    (1 + (isVatExempt ? 0 : parseFloat(newItem.vatRate) || 0) / 100)
                  ).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex space-x-2 justify-end">
                    <button
                      onClick={handleAddItem}
                      className="text-green-600 hover:text-green-900 cursor-pointer"
                      disabled={loading}
                    >
                      <FiCheck />
                    </button>
                    <button
                      onClick={handleCancelAdd}
                      className="text-red-600 hover:text-red-900 cursor-pointer"
                      disabled={loading}
                    >
                      <FiX />
                    </button>
                  </div>
                </td>
              </tr>
            )}
            
            {/* Empty state */}
            {!isAdding && jobItems.length === 0 && (
              <tr>
                <td colSpan={hasInvoice ? 6 : 7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No items added to this job sheet.
                  {!hasInvoice && (
                    <button 
                      onClick={() => setIsAdding(true)}
                      className="ml-2 text-primary-600 hover:text-primary-800 cursor-pointer"
                    >
                      Add your first item
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobItemList;