import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthContext } from '@/modules/auth/components/AuthProvider';
import { useForm } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import { format, addDays } from 'date-fns';
import { FiArrowLeft, FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as Sentry from '@sentry/browser';

const InvoiceGenerator = () => {
  const { jobSheetId } = useParams();
  const navigate = useNavigate();
  const { session } = useAuthContext();
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [jobSheet, setJobSheet] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [jobItems, setJobItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [invoiceDate, setInvoiceDate] = useState(new Date());
  const [dueDate, setDueDate] = useState(addDays(new Date(), 14));
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching data for job sheet ${jobSheetId} invoice generation...`);
        
        // Check if invoice already exists for this job sheet
        const invoicesResponse = await fetch(`/api/invoices?jobSheetId=${jobSheetId}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!invoicesResponse.ok) throw new Error('Failed to check existing invoices');
        const invoicesData = await invoicesResponse.json();
        
        if (invoicesData.length > 0) {
          toast.error('This job sheet already has an invoice');
          navigate(`/job-sheets/${jobSheetId}`);
          return;
        }
        
        // Fetch job sheet data
        const jobSheetResponse = await fetch(`/api/job-sheets/${jobSheetId}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!jobSheetResponse.ok) throw new Error('Failed to fetch job sheet');
        const jobSheetData = await jobSheetResponse.json();
        setJobSheet(jobSheetData);
        
        // Fetch customer
        const customersResponse = await fetch('/api/customers', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!customersResponse.ok) throw new Error('Failed to fetch customers');
        const customersData = await customersResponse.json();
        const customerData = customersData.find(c => c.id === jobSheetData.customerId);
        setCustomer(customerData);
        
        // Fetch vehicle
        const vehiclesResponse = await fetch('/api/vehicles', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!vehiclesResponse.ok) throw new Error('Failed to fetch vehicles');
        const vehiclesData = await vehiclesResponse.json();
        const vehicleData = vehiclesData.find(v => v.id === jobSheetData.vehicleId);
        setVehicle(vehicleData);
        
        // Fetch job items
        const jobItemsResponse = await fetch(`/api/job-items?jobSheetId=${jobSheetId}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!jobItemsResponse.ok) throw new Error('Failed to fetch job items');
        const jobItemsData = await jobItemsResponse.json();
        setJobItems(jobItemsData);
        
        // Fetch user settings
        const settingsResponse = await fetch('/api/settings', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!settingsResponse.ok) throw new Error('Failed to fetch settings');
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
        
        // Set form defaults
        let nextInvoiceNumber = '001';
        if (settingsData.invoicePrefix) {
          const invoiceNumber = `${settingsData.invoicePrefix}${nextInvoiceNumber}`;
          setValue('invoiceNumber', invoiceNumber);
        } else {
          setValue('invoiceNumber', `INV-${nextInvoiceNumber}`);
        }
        
        if (settingsData.paymentTerms) {
          setValue('paymentInstructions', settingsData.paymentTerms);
        }
        
        if (settingsData.defaultNotes) {
          setValue('notes', settingsData.defaultNotes);
        }
        
      } catch (error) {
        console.error('Error fetching invoice data:', error);
        Sentry.captureException(error);
        toast.error('Failed to load invoice data');
        navigate('/job-sheets');
      } finally {
        setLoading(false);
      }
    };
    
    if (session && jobSheetId) {
      fetchData();
    }
  }, [session, jobSheetId, navigate, setValue]);

  const calculateTotals = () => {
    if (!jobItems.length) return { subtotal: 0, vatAmount: 0, total: 0 };
    
    const subtotal = jobItems.reduce((sum, item) => {
      return sum + (parseFloat(item.unitPrice) * parseFloat(item.quantity));
    }, 0);
    
    let vatAmount = 0;
    if (!jobSheet?.isVatExempt) {
      vatAmount = jobItems.reduce((sum, item) => {
        const itemSubtotal = parseFloat(item.unitPrice) * parseFloat(item.quantity);
        return sum + (itemSubtotal * (parseFloat(item.vatRate) / 100));
      }, 0);
    }
    
    const total = subtotal + vatAmount;
    
    return {
      subtotal: subtotal.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const onSubmit = async (data) => {
    const totals = calculateTotals();
    
    if (parseFloat(totals.total) <= 0) {
      toast.error('Cannot create an invoice with zero total');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const invoiceData = {
        jobSheetId,
        invoiceNumber: data.invoiceNumber,
        invoiceDate: format(invoiceDate, 'yyyy-MM-dd'),
        dueDate: format(dueDate, 'yyyy-MM-dd'),
        subtotal: totals.subtotal,
        vatAmount: totals.vatAmount,
        total: totals.total,
        notes: data.notes,
        paymentInstructions: data.paymentInstructions
      };
      
      console.log('Creating invoice:', invoiceData);
      
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create invoice');
      }
      
      const result = await response.json();
      toast.success('Invoice created successfully');
      navigate(`/invoices/${result.id}`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      Sentry.captureException(error);
      toast.error('Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!jobSheet || !customer || !vehicle || !jobItems.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> Required data is missing. Make sure the job sheet has items added.</span>
        </div>
        <Link to={`/job-sheets/${jobSheetId}`} className="text-primary-600 hover:text-primary-800">
          <FiArrowLeft className="inline mr-1" /> Back to Job Sheet
        </Link>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <Link 
          to={`/job-sheets/${jobSheetId}`} 
          className="text-primary-600 hover:text-primary-800 mr-4"
        >
          <FiArrowLeft className="inline mr-1" /> Back to Job Sheet
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          Generate Invoice
        </h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Invoice Details</h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label" htmlFor="invoiceNumber">
                      Invoice Number *
                    </label>
                    <input
                      type="text"
                      id="invoiceNumber"
                      className={`input-field ${errors.invoiceNumber ? 'border-red-500' : ''}`}
                      {...register('invoiceNumber', { required: 'Invoice number is required' })}
                    />
                    {errors.invoiceNumber && (
                      <p className="error-text">{errors.invoiceNumber.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="form-label" htmlFor="invoiceDate">
                      Invoice Date *
                    </label>
                    <DatePicker
                      id="invoiceDate"
                      selected={invoiceDate}
                      onChange={date => setInvoiceDate(date)}
                      className="input-field"
                      dateFormat="dd/MM/yyyy"
                    />
                  </div>
                  
                  <div>
                    <label className="form-label" htmlFor="dueDate">
                      Due Date *
                    </label>
                    <DatePicker
                      id="dueDate"
                      selected={dueDate}
                      onChange={date => setDueDate(date)}
                      className="input-field"
                      dateFormat="dd/MM/yyyy"
                      minDate={invoiceDate}
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="form-label" htmlFor="paymentInstructions">
                    Payment Instructions
                  </label>
                  <textarea
                    id="paymentInstructions"
                    className="input-field h-24"
                    {...register('paymentInstructions')}
                    placeholder="Payment terms and instructions"
                  />
                </div>
                
                <div className="mt-6">
                  <label className="form-label" htmlFor="notes">
                    Notes
                  </label>
                  <textarea
                    id="notes"
                    className="input-field h-24"
                    {...register('notes')}
                    placeholder="Additional notes to appear on the invoice"
                  />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">Invoice Items</h2>
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {jobItems.map(item => {
                      const itemSubtotal = (parseFloat(item.unitPrice) * parseFloat(item.quantity)).toFixed(2);
                      const itemVat = jobSheet.isVatExempt ? 0 : (parseFloat(itemSubtotal) * (parseFloat(item.vatRate) / 100)).toFixed(2);
                      const itemTotal = (parseFloat(itemSubtotal) + parseFloat(itemVat)).toFixed(2);
                      
                      return (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {item.itemType}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.description}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {parseFloat(item.quantity).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            £{parseFloat(item.unitPrice).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                            {jobSheet.isVatExempt ? 'Exempt' : `${parseFloat(item.vatRate).toFixed(0)}%`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            £{itemTotal}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="p-6 bg-gray-50">
                <div className="flex justify-between py-2">
                  <span className="font-medium">Subtotal:</span>
                  <span>£{totals.subtotal}</span>
                </div>
                
                <div className="flex justify-between py-2">
                  <span className="font-medium">VAT ({jobSheet.isVatExempt ? 'Exempt' : '20%'}):</span>
                  <span>£{totals.vatAmount}</span>
                </div>
                
                <div className="flex justify-between py-2 text-lg font-bold">
                  <span>Total:</span>
                  <span>£{totals.total}</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Link 
                to={`/job-sheets/${jobSheetId}`} 
                className="btn-secondary mr-4 cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="btn-primary flex items-center cursor-pointer"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                    Creating Invoice...
                  </>
                ) : (
                  <>
                    <FiSave className="mr-2" /> Create Invoice
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Business Information</h2>
            </div>
            
            <div className="p-6">
              <p className="font-medium text-gray-900">{settings?.garageName || 'Your Garage'}</p>
              <p className="text-sm text-gray-600 whitespace-pre-line mt-2">{settings?.address}</p>
              {settings?.phone && <p className="text-sm text-gray-600 mt-2">Phone: {settings.phone}</p>}
              {settings?.vatNumber && <p className="text-sm text-gray-600 mt-2">VAT: {settings.vatNumber}</p>}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Customer Details</h2>
            </div>
            
            <div className="p-6">
              <p className="font-medium text-gray-900">{customer.name}</p>
              <p className="text-sm text-gray-600 mt-2">Phone: {customer.phone}</p>
              {customer.email && <p className="text-sm text-gray-600 mt-2">Email: {customer.email}</p>}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Vehicle Details</h2>
            </div>
            
            <div className="p-6">
              <p className="font-medium text-gray-900">{vehicle.registration}</p>
              <p className="text-sm text-gray-600 mt-2">{vehicle.make} {vehicle.model}</p>
              <p className="text-sm text-gray-600 mt-2">Mileage: {vehicle.mileage.toLocaleString()} miles</p>
              <p className="text-sm text-gray-600 mt-2">Fuel Type: {vehicle.fuelType}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerator;