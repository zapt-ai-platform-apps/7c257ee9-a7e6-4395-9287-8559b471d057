import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/modules/auth/components/AuthProvider';
import { useForm } from 'react-hook-form';
import { FiSave } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as Sentry from '@sentry/browser';

const SettingsForm = () => {
  const { session } = useAuthContext();
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        console.log('Fetching user settings...');
        
        const response = await fetch('/api/settings', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch settings');
        const settings = await response.json();
        
        // Set form values with existing settings
        setValue('garageName', settings.garageName || '');
        setValue('address', settings.address || '');
        setValue('phone', settings.phone || '');
        setValue('vatNumber', settings.vatNumber || '');
        setValue('hourlyRate', settings.hourlyRate || 60);
        setValue('invoicePrefix', settings.invoicePrefix || 'INV-');
        setValue('paymentTerms', settings.paymentTerms || 'Due within 14 days');
        setValue('defaultNotes', settings.defaultNotes || '');
        setValue('logoUrl', settings.logoUrl || '');
      } catch (error) {
        console.error('Error fetching settings:', error);
        Sentry.captureException(error);
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    
    if (session) {
      fetchSettings();
    }
  }, [session, setValue]);

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      console.log('Updating settings:', data);
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to update settings');
      await response.json();
      
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      Sentry.captureException(error);
      toast.error('Failed to update settings');
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-800">Business Information</h2>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label" htmlFor="garageName">
                Business Name
              </label>
              <input
                type="text"
                id="garageName"
                className="input-field"
                {...register('garageName')}
                placeholder="Your Garage Name"
              />
            </div>
            
            <div>
              <label className="form-label" htmlFor="phone">
                Phone Number
              </label>
              <input
                type="text"
                id="phone"
                className="input-field"
                {...register('phone')}
                placeholder="Business Phone Number"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="form-label" htmlFor="address">
                Business Address
              </label>
              <textarea
                id="address"
                className="input-field h-24"
                {...register('address')}
                placeholder="Full business address"
              />
            </div>
            
            <div>
              <label className="form-label" htmlFor="vatNumber">
                VAT Number
              </label>
              <input
                type="text"
                id="vatNumber"
                className="input-field"
                {...register('vatNumber')}
                placeholder="VAT Number (if registered)"
              />
            </div>
            
            <div>
              <label className="form-label" htmlFor="logoUrl">
                Logo URL
              </label>
              <input
                type="text"
                id="logoUrl"
                className="input-field"
                {...register('logoUrl')}
                placeholder="URL to your logo image"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter a full URL to your logo image for invoices
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Job & Invoice Defaults</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label" htmlFor="hourlyRate">
                  Default Hourly Rate (£)
                </label>
                <input
                  type="number"
                  id="hourlyRate"
                  className="input-field"
                  {...register('hourlyRate')}
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div>
                <label className="form-label" htmlFor="invoicePrefix">
                  Invoice Number Prefix
                </label>
                <input
                  type="text"
                  id="invoicePrefix"
                  className="input-field"
                  {...register('invoicePrefix')}
                  placeholder="INV-"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="form-label" htmlFor="paymentTerms">
                  Default Payment Terms
                </label>
                <textarea
                  id="paymentTerms"
                  className="input-field"
                  {...register('paymentTerms')}
                  placeholder="Payment terms that will appear on invoices"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="form-label" htmlFor="defaultNotes">
                  Default Invoice Notes
                </label>
                <textarea
                  id="defaultNotes"
                  className="input-field h-24"
                  {...register('defaultNotes')}
                  placeholder="Default notes to appear on all invoices"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="btn-primary flex items-center cursor-pointer"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" /> Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsForm;