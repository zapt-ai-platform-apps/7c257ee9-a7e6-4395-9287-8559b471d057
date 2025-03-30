export const api = {
  async getJobSheets(session) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch('/api/job-sheets', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch job sheets');
    }
    
    return response.json();
  },
  
  async getJobSheet(session, id) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch(`/api/job-sheets/${id}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch job sheet');
    }
    
    return response.json();
  },
  
  async createJobSheet(session, jobSheetData) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch('/api/job-sheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jobSheetData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create job sheet');
    }
    
    return response.json();
  },
  
  async updateJobSheet(session, id, jobSheetData) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch(`/api/job-sheets/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jobSheetData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update job sheet');
    }
    
    return response.json();
  },
  
  async deleteJobSheet(session, id) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch(`/api/job-sheets/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete job sheet');
    }
    
    return true;
  },
  
  async getJobItems(session, jobSheetId) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch(`/api/job-items?jobSheetId=${jobSheetId}`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch job items');
    }
    
    return response.json();
  },
  
  async createJobItem(session, jobItemData) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch('/api/job-items', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jobItemData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create job item');
    }
    
    return response.json();
  },
  
  async updateJobItem(session, id, jobItemData) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch(`/api/job-items/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jobItemData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update job item');
    }
    
    return response.json();
  },
  
  async deleteJobItem(session, id) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch(`/api/job-items/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete job item');
    }
    
    return true;
  }
};