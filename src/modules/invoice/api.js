export const api = {
  async getInvoices(session) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch('/api/invoices', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch invoices');
    }
    
    return response.json();
  },
  
  async getInvoice(session, id) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch(`/api/invoices/${id}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch invoice');
    }
    
    return response.json();
  },
  
  async createInvoice(session, invoiceData) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoiceData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create invoice');
    }
    
    return response.json();
  },
  
  async updateInvoice(session, id, invoiceData) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch(`/api/invoices/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(invoiceData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update invoice');
    }
    
    return response.json();
  }
};