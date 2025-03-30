import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/modules/auth/components/AuthProvider';
import { format } from 'date-fns';
import { FiArrowLeft, FiEdit2, FiTrash2, FiPlus, FiDollarSign, FiPrinter } from 'react-icons/fi';
import { toast } from 'react-toastify';
import JobItemList from './JobItemList';
import * as Sentry from '@sentry/browser';

const JobSheetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuthContext();
  
  const [loading, setLoading] = useState(true);
  const [jobSheet, setJobSheet] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [jobItems, setJobItems] = useState([]);
  const [hasInvoice, setHasInvoice] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching data for job sheet ${id}...`);
        
        // Fetch job sheet
        const jobSheetResponse = await fetch(`/api/job-sheets/${id}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!jobSheetResponse.ok) throw new Error('Failed to fetch job sheet');
        const jobSheetData = await jobSheetResponse.json();
        setJobSheet(jobSheetData);
        
        // Fetch customer
        const customerResponse = await fetch(`/api/customers`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!customerResponse.ok) throw new Error('Failed to fetch customer data');
        const customersData = await customerResponse.json();
        const customerData = customersData.find(c => c.id === jobSheetData.customerId);
        setCustomer(customerData);
        
        // Fetch vehicle
        const vehicleResponse = await fetch(`/api/vehicles`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!vehicleResponse.ok) throw new Error('Failed to fetch vehicle data');
        const vehiclesData = await vehicleResponse.json();
        const vehicleData = vehiclesData.find(v => v.id === jobSheetData.vehicleId);
        setVehicle(vehicleData);
        
        // Fetch job items
        const jobItemsResponse = await fetch(`/api/job-items?jobSheetId=${id}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!jobItemsResponse.ok) throw new Error('Failed to fetch job items');
        const jobItemsData = await jobItemsResponse.json();
        setJobItems(jobItemsData);
        
        // Check if job sheet has invoices
        const invoicesResponse = await fetch(`/api/invoices?jobSheetId=${id}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!invoicesResponse.ok) throw new Error('Failed to fetch invoices');
        const invoicesData = await invoicesResponse.json();
        setHasInvoice(invoicesData.length > 0);
        
      } catch (error) {
        console.error('Error fetching job sheet data:', error);
        Sentry.captureException(error);
        toast.error('Failed to load job sheet details');
        navigate('/job-sheets');
      } finally {
        setLoading(false);
      }
    };
    
    if (session && id) {
      fetchData();
    }
  }, [session, id, navigate]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this job sheet?')) return;
    
    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/job-sheets/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete job sheet');
      
      toast.success('Job sheet deleted successfully');
      navigate('/job-sheets');
    } catch (error) {
      console.error('Error deleting job sheet:', error);
      Sentry.captureException(error);
      toast.error('Failed to delete job sheet');
    } finally {
      setDeleteLoading(false);
    }
  };

  const calculateTotals = () => {
    if (!jobItems.length) return { subtotal: 0, vatAmount: 0, total: 0 };
    
    const subtotal = jobItems.reduce((sum, item) => {
      return sum + (parseFloat(item.unitPrice) * parseFloat(item.quantity));
    }, 0);
    
    let vatAmount = 0;
    if (!jobSheet.isVatExempt) {
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

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!jobSheet || !customer || !vehicle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> Job sheet or related data not found.</span>
        </div>
        <Link to="/job-sheets" className="mt-4 text-primary-600 hover:text-primary-800 inline-block">
          <FiArrowLeft className="inline mr-1" /> Back to Job Sheets
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          <Link to="/job-sheets" className="text-primary-600 hover:text-primary-800 mr-4">
            <FiArrowLeft className="inline mr-1" /> Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Job Sheet #{jobSheet.id}
          </h1>
          <span className={`ml-4 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            jobSheet.status === 'Completed' ? 'bg-green-100 text-green-800' :
            jobSheet.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
            jobSheet.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {jobSheet.status}
          </span>
        </div>
        
        <div className="flex space-x-2">
          <Link to={`/job-sheets/${id}/edit`} className="btn-secondary flex items-center cursor-pointer">
            <FiEdit2 className="mr-2" /> Edit
          </Link>
          {!hasInvoice && (
            <>
              <button 
                onClick={handleDelete} 
                className="btn-secondary bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500 flex items-center cursor-pointer"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <span className="inline-block h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin mr-2"></span>
                ) : (
                  <FiTrash2 className="mr-2" />
                )}
                Delete
              </button>
              
              <Link to={`/job-sheets/${id}/invoice`} className="btn-primary flex items-center cursor-pointer">
                <FiDollarSign className="mr-2" /> Generate Invoice
              </Link>
            </>
          )}
          {hasInvoice && (
            <Link to={`/invoices?jobSheetId=${id}`} className="btn-secondary flex items-center cursor-pointer">
              <FiDollarSign className="mr-2" /> View Invoice
            </Link>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Job Details</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date In</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(jobSheet.dateIn), 'dd MMM yyyy')}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date Out</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {jobSheet.dateOut 
                      ? format(new Date(jobSheet.dateOut), 'dd MMM yyyy')
                      : 'Not set'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Technician</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {jobSheet.technicianName || 'Not assigned'}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">VAT Status</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {jobSheet.isVatExempt ? 'VAT Exempt' : 'VAT Applicable'}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500">Reported Problems</h3>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                  {jobSheet.reportedProblems || 'None reported'}
                </p>
              </div>
              
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500">Diagnosis</h3>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                  {jobSheet.diagnosis || 'No diagnosis recorded'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <JobItemList 
              jobItems={jobItems}
              setJobItems={setJobItems}
              jobSheetId={id}
              isVatExempt={jobSheet.isVatExempt}
              hasInvoice={hasInvoice}
              session={session}
            />
          </div>
          
          <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-800">Totals</h2>
            </div>
            
            <div className="p-6">
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">Subtotal:</span>
                <span>£{totals.subtotal}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b">
                <span className="font-medium">VAT ({jobSheet.isVatExempt ? 'Exempt' : '20%'}):</span>
                <span>£{totals.vatAmount}</span>
              </div>
              
              <div className="flex justify-between py-2 text-lg font-bold">
                <span>Total:</span>
                <span>£{totals.total}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Customer Details</h2>
            </div>
            
            <div className="p-6">
              <h3 className="font-medium text-gray-900">{customer.name}</h3>
              <p className="text-sm text-gray-600">{customer.phone}</p>
              {customer.email && <p className="text-sm text-gray-600">{customer.email}</p>}
            </div>
          </div>
          
          <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-800">Vehicle Details</h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">Registration</h3>
                <p className="mt-1 text-sm text-gray-900 font-medium">
                  {vehicle.registration}
                </p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">Make & Model</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {vehicle.make} {vehicle.model}
                </p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">Mileage</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {vehicle.mileage.toLocaleString()} miles
                </p>
              </div>
              
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500">Fuel Type</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {vehicle.fuelType}
                </p>
              </div>
              
              {vehicle.vin && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500">VIN</h3>
                  <p className="mt-1 text-sm text-gray-900 break-all">
                    {vehicle.vin}
                  </p>
                </div>
              )}
              
              {vehicle.motDueDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">MOT Due Date</h3>
                  <p className="mt-1 text-sm text-gray-900">
                    {format(new Date(vehicle.motDueDate), 'dd MMM yyyy')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobSheetDetail;