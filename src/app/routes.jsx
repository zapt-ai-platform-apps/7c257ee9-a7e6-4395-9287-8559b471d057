import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '@/modules/auth/components/ProtectedRoute';
import PublicRoute from '@/modules/auth/components/PublicRoute';
import Login from '@/modules/auth/components/Login';
import Layout from '@/modules/layout/components/Layout';
import Dashboard from '@/modules/dashboard/components/Dashboard';
import JobSheetList from '@/modules/jobSheet/components/JobSheetList';
import JobSheetForm from '@/modules/jobSheet/components/JobSheetForm';
import JobSheetDetail from '@/modules/jobSheet/components/JobSheetDetail';
import InvoiceGenerator from '@/modules/invoice/components/InvoiceGenerator';
import InvoiceDetail from '@/modules/invoice/components/InvoiceDetail';
import InvoiceList from '@/modules/invoice/components/InvoiceList';
import SettingsForm from '@/modules/settings/components/SettingsForm';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      
      {/* Protected routes */}
      <Route element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/job-sheets" element={<JobSheetList />} />
        <Route path="/job-sheets/new" element={<JobSheetForm />} />
        <Route path="/job-sheets/:id" element={<JobSheetDetail />} />
        <Route path="/job-sheets/:id/edit" element={<JobSheetForm />} />
        <Route path="/job-sheets/:jobSheetId/invoice" element={<InvoiceGenerator />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/:id" element={<InvoiceDetail />} />
        <Route path="/settings" element={<SettingsForm />} />
      </Route>
      
      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;