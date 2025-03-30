import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/modules/auth/components/AuthProvider';
import AppRoutes from './routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as Sentry from '@sentry/browser';

const App = () => {
  try {
    return (
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-gray-100 text-gray-900">
            <AppRoutes />
            <ToastContainer position="bottom-right" />
            <div className="fixed bottom-4 left-4 z-40">
              <a 
                href="https://www.zapt.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-gray-600 hover:text-primary-600"
              >
                Made on ZAPT
              </a>
            </div>
          </div>
        </AuthProvider>
      </BrowserRouter>
    );
  } catch (error) {
    console.error('Error in App component:', error);
    Sentry.captureException(error);
    
    // Return a simple fallback UI
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">App Error</h2>
          <p className="text-gray-700 mb-4">
            Something went wrong when loading the application. Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary-600 text-white font-medium rounded cursor-pointer"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
};

export default App;