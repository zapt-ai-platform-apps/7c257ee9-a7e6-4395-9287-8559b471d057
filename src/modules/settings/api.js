export const api = {
  async getSettings(session) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch('/api/settings', {
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }
    
    return response.json();
  },
  
  async updateSettings(session, settingsData) {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }
    
    const response = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settingsData)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update settings');
    }
    
    return response.json();
  }
};