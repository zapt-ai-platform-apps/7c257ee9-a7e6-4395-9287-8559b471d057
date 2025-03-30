import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthContext } from '@/modules/auth/components/AuthProvider';
import { FiFileText, FiDollarSign, FiUsers, FiTruck, FiPlus, FiClock } from 'react-icons/fi';
import { format } from 'date-fns';

const Dashboard = () => {
  const { session } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalJobSheets: 0,
    totalInvoices: 0,
    totalCustomers: 0,
    totalVehicles: 0
  });
  const [recentJobSheets, setRecentJobSheets] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch job sheets
        const jobSheetsResponse = await fetch('/api/job-sheets', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!jobSheetsResponse.ok) throw new Error('Failed to fetch job sheets');
        const jobSheets = await jobSheetsResponse.json();
        
        // Fetch invoices
        const invoicesResponse = await fetch('/api/invoices', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!invoicesResponse.ok) throw new Error('Failed to fetch invoices');
        const invoices = await invoicesResponse.json();
        
        // Fetch customers
        const customersResponse = await fetch('/api/customers', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!customersResponse.ok) throw new Error('Failed to fetch customers');
        const customers = await customersResponse.json();
        
        // Fetch vehicles
        const vehiclesResponse = await fetch('/api/vehicles', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!vehiclesResponse.ok) throw new Error('Failed to fetch vehicles');
        const vehicles = await vehiclesResponse.json();
        
        // Set statistics
        setStats({
          totalJobSheets: jobSheets.length,
          totalInvoices: invoices.length,
          totalCustomers: customers.length,
          totalVehicles: vehicles.length
        });
        
        // Set recent job sheets (last 5)
        const sortedJobSheets = [...jobSheets].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        ).slice(0, 5);
        
        setRecentJobSheets(sortedJobSheets);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchDashboardData();
    }
  }, [session]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Job Sheets Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <FiFileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Job Sheets</p>
                <p className="text-xl font-semibold text-gray-800">{stats.totalJobSheets}</p>
              </div>
            </div>
          </div>
          
          {/* Invoices Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <FiDollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Invoices</p>
                <p className="text-xl font-semibold text-gray-800">{stats.totalInvoices}</p>
              </div>
            </div>
          </div>
          
          {/* Customers Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <FiUsers className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Customers</p>
                <p className="text-xl font-semibold text-gray-800">{stats.totalCustomers}</p>
              </div>
            </div>
          </div>
          
          {/* Vehicles Stats */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <FiTruck className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Vehicles</p>
                <p className="text-xl font-semibold text-gray-800">{stats.totalVehicles}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Job Sheets */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-medium text-gray-800">Recent Job Sheets</h2>
              <Link 
                to="/job-sheets" 
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                View All
              </Link>
            </div>
            
            <div className="p-6">
              {recentJobSheets.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date In
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {recentJobSheets.map((jobSheet) => (
                        <tr key={jobSheet.id} className="hover:bg-gray-50">
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(jobSheet.dateIn), 'dd MMM yyyy')}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              jobSheet.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              jobSheet.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {jobSheet.status}
                            </span>
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                            Job #{jobSheet.id}
                          </td>
                          <td className="px-3 py-4 whitespace-nowrap text-sm font-medium">
                            <Link to={`/job-sheets/${jobSheet.id}`} className="text-primary-600 hover:text-primary-900 mr-3">
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No job sheets found</p>
                  <Link to="/job-sheets/new" className="mt-2 inline-flex items-center text-primary-600 hover:text-primary-800">
                    <FiPlus className="mr-1" /> Create your first job sheet
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-medium text-gray-800">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-4">
              <Link 
                to="/job-sheets/new" 
                className="block w-full py-3 px-4 rounded-md shadow bg-primary-600 text-white text-center font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 cursor-pointer"
              >
                <FiFileText className="inline mr-2" /> New Job Sheet
              </Link>
              
              <Link 
                to="/job-sheets" 
                className="block w-full py-3 px-4 rounded-md shadow bg-gray-100 text-gray-800 text-center font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer"
              >
                <FiClock className="inline mr-2" /> View All Job Sheets
              </Link>
              
              <Link 
                to="/invoices" 
                className="block w-full py-3 px-4 rounded-md shadow bg-gray-100 text-gray-800 text-center font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 cursor-pointer"
              >
                <FiDollarSign className="inline mr-2" /> View All Invoices
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;