import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '@/modules/auth/components/AuthProvider';
import { format, isAfter } from 'date-fns';
import { FiEye, FiSearch, FiFilter, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as Sentry from '@sentry/browser';

const InvoiceList = () => {
  const { session } = useAuthContext();
  const [searchParams] = useSearchParams();
  const jobSheetId = searchParams.get('jobSheetId');
  
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [jobSheet, setJobSheet] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching invoices data...');
        
        // Fetch specific job sheet if specified
        if (jobSheetId) {
          const jobSheetResponse = await fetch(`/api/job-sheets/${jobSheetId}`, {
            headers: {
              Authorization: `Bearer ${session?.access_token}`
            }
          });
          
          if (!jobSheetResponse.ok) throw new Error('Failed to fetch job sheet');
          const jobSheetData = await jobSheetResponse.json();
          setJobSheet(jobSheetData);
        }
        
        // Fetch invoices
        const invoicesUrl = jobSheetId 
          ? `/api/invoices?jobSheetId=${jobSheetId}`
          : '/api/invoices';
        
        const invoicesResponse = await fetch(invoicesUrl, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!invoicesResponse.ok) throw new Error('Failed to fetch invoices');
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData);
        
        // Fetch customers
        const customersResponse = await fetch('/api/customers', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!customersResponse.ok) throw new Error('Failed to fetch customers');
        const customersData = await customersResponse.json();
        setCustomers(customersData);
        
      } catch (error) {
        console.error('Error fetching invoices:', error);
        Sentry.captureException(error);
        toast.error('Failed to load invoices');
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchData();
    }
  }, [session, jobSheetId]);

  // Helper function to get customer name by job sheet id
  const getCustomerName = (invoice) => {
    if (jobSheet) return customers.find(c => c.id === jobSheet.customerId)?.name || 'Unknown';
    
    // Find job sheet for this invoice, then find customer
    return 'Customer';
  };

  const isOverdue = (invoice) => {
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    return invoice.status === 'Unpaid' && isAfter(today, dueDate);
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = searchTerm === '' || 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
      getCustomerName(invoice).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === '' || invoice.status === statusFilter;
    
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
        {jobSheetId ? (
          <div className="flex items-center mb-4 md:mb-0">
            <Link to="/job-sheets" className="text-primary-600 hover:text-primary-800 mr-4">
              <FiArrowLeft className="inline mr-1" /> Back to Job Sheets
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">
              Invoice for Job Sheet #{jobSheetId}
            </h1>
          </div>
        ) : (
          <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">Invoices</h1>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {!jobSheetId && (
          <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search invoices..."
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
                <option value="Unpaid">Unpaid</option>
                <option value="Paid">Paid</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        )}
        
        {filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  {!jobSheetId && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                  )}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
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
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice.id} className={`hover:bg-gray-50 ${isOverdue(invoice) ? 'bg-red-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={isOverdue(invoice) ? 'text-red-600 font-medium' : ''}>
                        {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
                        {isOverdue(invoice) && ' (Overdue)'}
                      </span>
                    </td>
                    {!jobSheetId && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {getCustomerName(invoice)}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium text-right">
                      £{parseFloat(invoice.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/invoices/${invoice.id}`} className="text-primary-600 hover:text-primary-900 mx-2 cursor-pointer">
                        <FiEye className="inline" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No invoices found</p>
            <Link to="/job-sheets" className="text-primary-600 hover:text-primary-800">
              Go to Job Sheets
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceList;