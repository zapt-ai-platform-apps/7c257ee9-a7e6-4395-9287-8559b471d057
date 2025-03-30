import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/modules/auth/components/AuthProvider';
import AppRoutes from './routes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
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
};

export default App;