import { supabase } from '@/supabaseClient';

export const api = {
  async fetchDashboardData(session) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    try {
      // Fetch job sheets
      const jobSheetsResponse = await fetch('/api/job-sheets', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (!jobSheetsResponse.ok) throw new Error('Failed to fetch job sheets');
      const jobSheets = await jobSheetsResponse.json();
      
      // Fetch invoices
      const invoicesResponse = await fetch('/api/invoices', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (!invoicesResponse.ok) throw new Error('Failed to fetch invoices');
      const invoices = await invoicesResponse.json();
      
      // Fetch customers
      const customersResponse = await fetch('/api/customers', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (!customersResponse.ok) throw new Error('Failed to fetch customers');
      const customers = await customersResponse.json();
      
      // Fetch vehicles
      const vehiclesResponse = await fetch('/api/vehicles', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (!vehiclesResponse.ok) throw new Error('Failed to fetch vehicles');
      const vehicles = await vehiclesResponse.json();
      
      return {
        jobSheets,
        invoices,
        customers,
        vehicles,
        stats: {
          totalJobSheets: jobSheets.length,
          totalInvoices: invoices.length,
          totalCustomers: customers.length,
          totalVehicles: vehicles.length
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
};