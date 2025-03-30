import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/modules/auth/components/AuthProvider';
import { format } from 'date-fns';
import { FiPlus, FiEye, FiEdit2, FiTrash2, FiSearch, FiFilter } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as Sentry from '@sentry/browser';

const JobSheetList = () => {
  const { session } = useAuthContext();
  const [jobSheets, setJobSheets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching job sheets data...');
        
        // Fetch job sheets
        const jobSheetsResponse = await fetch('/api/job-sheets', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!jobSheetsResponse.ok) throw new Error('Failed to fetch job sheets');
        const jobSheetsData = await jobSheetsResponse.json();
        
        // Fetch customers
        const customersResponse = await fetch('/api/customers', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!customersResponse.ok) throw new Error('Failed to fetch customers');
        const customersData = await customersResponse.json();
        
        // Fetch vehicles
        const vehiclesResponse = await fetch('/api/vehicles', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!vehiclesResponse.ok) throw new Error('Failed to fetch vehicles');
        const vehiclesData = await vehiclesResponse.json();
        
        setJobSheets(jobSheetsData);
        setCustomers(customersData);
        setVehicles(vehiclesData);
      } catch (error) {
        console.error('Error fetching job sheets:', error);
        Sentry.captureException(error);
        toast.error('Failed to load job sheets');
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchData();
    }
  }, [session]);

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : 'Unknown Customer';
  };

  const getVehicleInfo = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registration})` : 'Unknown Vehicle';
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this job sheet?')) return;
    
    try {
      setDeleteLoading(id);
      const response = await fetch(`/api/job-sheets/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session?.access_token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete job sheet');
      
      setJobSheets(jobSheets.filter(sheet => sheet.id !== id));
      toast.success('Job sheet deleted successfully');
    } catch (error) {
      console.error('Error deleting job sheet:', error);
      Sentry.captureException(error);
      toast.error('Failed to delete job sheet');
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredJobSheets = jobSheets.filter(jobSheet => {
    const matchesSearch = 
      searchTerm === '' || 
      getCustomerName(jobSheet.customerId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getVehicleInfo(jobSheet.vehicleId).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(jobSheet.id).includes(searchTerm);
    
    const matchesStatus = statusFilter === '' || jobSheet.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Job Sheets</h1>
        <Link 
          to="/job-sheets/new" 
          className="btn-primary flex items-center cursor-pointer"
        >
          <FiPlus className="mr-2" /> New Job Sheet
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search job sheets..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center">
            <FiFilter className="text-gray-400 mr-2" />
            <select
              className="input-field"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        
        {filteredJobSheets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vehicle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredJobSheets.map((jobSheet) => (
                  <tr key={jobSheet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {jobSheet.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(jobSheet.dateIn), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCustomerName(jobSheet.customerId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getVehicleInfo(jobSheet.vehicleId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        jobSheet.status === 'Completed' ? 'bg-green-100 text-green-800' :
                        jobSheet.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                        jobSheet.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {jobSheet.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/job-sheets/${jobSheet.id}`} className="text-primary-600 hover:text-primary-900 mx-2">
                        <FiEye className="inline" />
                      </Link>
                      <Link to={`/job-sheets/${jobSheet.id}/edit`} className="text-blue-600 hover:text-blue-900 mx-2">
                        <FiEdit2 className="inline" />
                      </Link>
                      <button 
                        onClick={() => handleDelete(jobSheet.id)} 
                        className="text-red-600 hover:text-red-900 mx-2 cursor-pointer"
                        disabled={deleteLoading === jobSheet.id}
                      >
                        {deleteLoading === jobSheet.id ? 
                          <span className="inline-block h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span> :
                          <FiTrash2 className="inline" />
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No job sheets found</p>
            <Link 
              to="/job-sheets/new" 
              className="btn-primary inline-flex items-center cursor-pointer"
            >
              <FiPlus className="mr-2" /> Create your first job sheet
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobSheetList;