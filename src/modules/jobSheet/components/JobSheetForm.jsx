import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuthContext } from '@/modules/auth/components/AuthProvider';
import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FiSave, FiArrowLeft, FiPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as Sentry from '@sentry/browser';

const JobSheetForm = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { session } = useAuthContext();
  const { register, handleSubmit, setValue, formState: { errors }, reset } = useForm();
  
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [dateIn, setDateIn] = useState(new Date());
  const [dateOut, setDateOut] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching data for job sheet form...');
        
        // Fetch customers
        const customersResponse = await fetch('/api/customers', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!customersResponse.ok) throw new Error('Failed to fetch customers');
        const customersData = await customersResponse.json();
        setCustomers(customersData);
        
        // Fetch vehicles
        const vehiclesResponse = await fetch('/api/vehicles', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!vehiclesResponse.ok) throw new Error('Failed to fetch vehicles');
        const vehiclesData = await vehiclesResponse.json();
        setVehicles(vehiclesData);
        
        // If editing, fetch job sheet data
        if (isEditMode) {
          const jobSheetResponse = await fetch(`/api/job-sheets/${id}`, {
            headers: {
              Authorization: `Bearer ${session?.access_token}`
            }
          });
          
          if (!jobSheetResponse.ok) throw new Error('Failed to fetch job sheet');
          const jobSheetData = await jobSheetResponse.json();
          
          // Set form values
          reset({
            customerId: jobSheetData.customerId.toString(),
            vehicleId: jobSheetData.vehicleId.toString(),
            reportedProblems: jobSheetData.reportedProblems || '',
            diagnosis: jobSheetData.diagnosis || '',
            technicianName: jobSheetData.technicianName || '',
            status: jobSheetData.status,
            isVatExempt: jobSheetData.isVatExempt
          });
          
          setSelectedCustomerId(jobSheetData.customerId.toString());
          setDateIn(new Date(jobSheetData.dateIn));
          setDateOut(jobSheetData.dateOut ? new Date(jobSheetData.dateOut) : null);
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
        Sentry.captureException(error);
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchData();
    }
  }, [session, id, isEditMode, reset]);

  // Filter vehicles when customer is selected
  useEffect(() => {
    if (selectedCustomerId) {
      const filtered = vehicles.filter(vehicle => vehicle.customerId === parseInt(selectedCustomerId));
      setFilteredVehicles(filtered);
    } else {
      setFilteredVehicles([]);
    }
  }, [selectedCustomerId, vehicles]);

  const onCustomerChange = (e) => {
    const customerId = e.target.value;
    setSelectedCustomerId(customerId);
    setValue('vehicleId', ''); // Reset vehicle selection
  };

  const onSubmit = async (data) => {
    try {
      setSubmitLoading(true);
      
      const jobSheetData = {
        ...data,
        customerId: parseInt(data.customerId),
        vehicleId: parseInt(data.vehicleId),
        dateIn: format(dateIn, 'yyyy-MM-dd'),
        dateOut: dateOut ? format(dateOut, 'yyyy-MM-dd') : null
      };
      
      console.log('Submitting job sheet data:', jobSheetData);
      
      let response;
      if (isEditMode) {
        // Update existing job sheet
        response = await fetch(`/api/job-sheets/${id}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jobSheetData)
        });
      } else {
        // Create new job sheet
        response = await fetch('/api/job-sheets', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jobSheetData)
        });
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save job sheet');
      }
      
      const result = await response.json();
      toast.success(`Job sheet ${isEditMode ? 'updated' : 'created'} successfully`);
      navigate(`/job-sheets/${result.id}`);
    } catch (error) {
      console.error('Error saving job sheet:', error);
      Sentry.captureException(error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} job sheet`);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <Link to="/job-sheets" className="text-primary-600 hover:text-primary-800 mr-4">
          <FiArrowLeft className="inline mr-1" /> Back to Job Sheets
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Edit Job Sheet' : 'Create New Job Sheet'}
        </h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label" htmlFor="customerId">
                Customer *
              </label>
              <div className="flex">
                <select
                  id="customerId"
                  className={`input-field ${errors.customerId ? 'border-red-500' : ''}`}
                  {...register('customerId', { required: 'Customer is required' })}
                  onChange={onCustomerChange}
                >
                  <option value="">Select Customer</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} ({customer.phone})
                    </option>
                  ))}
                </select>
              </div>
              {errors.customerId && (
                <p className="error-text">{errors.customerId.message}</p>
              )}
            </div>
            
            <div>
              <label className="form-label" htmlFor="vehicleId">
                Vehicle *
              </label>
              <div className="flex">
                <select
                  id="vehicleId"
                  className={`input-field ${errors.vehicleId ? 'border-red-500' : ''}`}
                  {...register('vehicleId', { required: 'Vehicle is required' })}
                  disabled={!selectedCustomerId}
                >
                  <option value="">Select Vehicle</option>
                  {filteredVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.make} {vehicle.model} ({vehicle.registration})
                    </option>
                  ))}
                </select>
              </div>
              {!selectedCustomerId && (
                <p className="text-gray-500 text-sm mt-1">Select a customer first</p>
              )}
              {errors.vehicleId && (
                <p className="error-text">{errors.vehicleId.message}</p>
              )}
            </div>
            
            <div>
              <label className="form-label" htmlFor="dateIn">
                Date In *
              </label>
              <DatePicker
                id="dateIn"
                selected={dateIn}
                onChange={date => setDateIn(date)}
                className="input-field"
                dateFormat="dd/MM/yyyy"
              />
            </div>
            
            <div>
              <label className="form-label" htmlFor="dateOut">
                Date Out
              </label>
              <DatePicker
                id="dateOut"
                selected={dateOut}
                onChange={date => setDateOut(date)}
                className="input-field"
                dateFormat="dd/MM/yyyy"
                isClearable
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="form-label" htmlFor="reportedProblems">
                Reported Problems
              </label>
              <textarea
                id="reportedProblems"
                className="input-field h-24"
                {...register('reportedProblems')}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="form-label" htmlFor="diagnosis">
                Diagnosis
              </label>
              <textarea
                id="diagnosis"
                className="input-field h-24"
                {...register('diagnosis')}
              />
            </div>
            
            <div>
              <label className="form-label" htmlFor="technicianName">
                Technician Name
              </label>
              <input
                type="text"
                id="technicianName"
                className="input-field"
                {...register('technicianName')}
              />
            </div>
            
            <div>
              <label className="form-label" htmlFor="status">
                Status *
              </label>
              <select
                id="status"
                className="input-field"
                {...register('status', { required: 'Status is required' })}
                defaultValue="Draft"
              >
                <option value="Draft">Draft</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
              {errors.status && (
                <p className="error-text">{errors.status.message}</p>
              )}
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isVatExempt"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                {...register('isVatExempt')}
              />
              <label htmlFor="isVatExempt" className="ml-2 block text-gray-700">
                VAT Exempt
              </label>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <Link to="/job-sheets" className="btn-secondary mr-4 cursor-pointer">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn-primary flex items-center cursor-pointer"
              disabled={submitLoading}
            >
              {submitLoading ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" /> Save Job Sheet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobSheetForm;