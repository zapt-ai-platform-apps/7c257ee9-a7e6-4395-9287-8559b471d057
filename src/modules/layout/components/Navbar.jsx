import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/modules/auth/components/AuthProvider';
import { 
  FiMenu, FiX, FiUser, FiSettings, 
  FiLogOut, FiFileText, FiHome, FiDollarSign
} from 'react-icons/fi';

const Navbar = () => {
  const { user, signOut } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <nav className="bg-primary-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 font-bold text-xl">
              Mechanic Job Sheet
            </Link>
            
            {/* Desktop menu */}
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                <Link 
                  to="/dashboard" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/dashboard') 
                      ? 'bg-primary-800 text-white' 
                      : 'hover:bg-primary-600'
                  }`}
                >
                  <FiHome className="inline mr-1" /> Dashboard
                </Link>
                <Link 
                  to="/job-sheets" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/job-sheets') 
                      ? 'bg-primary-800 text-white' 
                      : 'hover:bg-primary-600'
                  }`}
                >
                  <FiFileText className="inline mr-1" /> Job Sheets
                </Link>
                <Link 
                  to="/invoices" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/invoices') 
                      ? 'bg-primary-800 text-white' 
                      : 'hover:bg-primary-600'
                  }`}
                >
                  <FiDollarSign className="inline mr-1" /> Invoices
                </Link>
                <Link 
                  to="/settings" 
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    isActive('/settings') 
                      ? 'bg-primary-800 text-white' 
                      : 'hover:bg-primary-600'
                  }`}
                >
                  <FiSettings className="inline mr-1" /> Settings
                </Link>
              </div>
            </div>
          </div>
          
          {/* User menu */}
          <div className="hidden md:block">
            <div className="flex items-center">
              <div className="ml-4 flex items-center md:ml-6">
                <div className="relative">
                  <div className="flex items-center">
                    <span className="mr-2 text-sm truncate max-w-[120px]">{user?.email}</span>
                    <button
                      onClick={handleSignOut}
                      className="bg-primary-800 p-2 rounded-md flex items-center text-sm focus:outline-none cursor-pointer"
                    >
                      <FiLogOut className="h-5 w-5" />
                      <span className="ml-1">Sign Out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-primary-600 focus:outline-none cursor-pointer"
            >
              {isMenuOpen ? (
                <FiX className="block h-6 w-6" />
              ) : (
                <FiMenu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/dashboard" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/dashboard') 
                  ? 'bg-primary-800 text-white' 
                  : 'hover:bg-primary-600'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FiHome className="inline mr-2" /> Dashboard
            </Link>
            <Link 
              to="/job-sheets" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/job-sheets') 
                  ? 'bg-primary-800 text-white' 
                  : 'hover:bg-primary-600'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FiFileText className="inline mr-2" /> Job Sheets
            </Link>
            <Link 
              to="/invoices" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/invoices') 
                  ? 'bg-primary-800 text-white' 
                  : 'hover:bg-primary-600'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FiDollarSign className="inline mr-2" /> Invoices
            </Link>
            <Link 
              to="/settings" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/settings') 
                  ? 'bg-primary-800 text-white' 
                  : 'hover:bg-primary-600'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <FiSettings className="inline mr-2" /> Settings
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-primary-800">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <FiUser className="h-10 w-10 rounded-full bg-primary-800 p-2" />
              </div>
              <div className="ml-3">
                <div className="text-base font-medium">{user?.email}</div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button
                onClick={() => {
                  handleSignOut();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium hover:bg-primary-600 cursor-pointer"
              >
                <FiLogOut className="inline mr-2" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;