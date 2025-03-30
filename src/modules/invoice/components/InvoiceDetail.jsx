import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/modules/auth/components/AuthProvider';
import { format } from 'date-fns';
import { FiArrowLeft, FiPrinter, FiCheck, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import * as Sentry from '@sentry/browser';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuthContext();
  const invoiceRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [jobSheet, setJobSheet] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [jobItems, setJobItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching data for invoice ${id}...`);
        
        // Fetch invoice
        const invoiceResponse = await fetch(`/api/invoices/${id}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!invoiceResponse.ok) throw new Error('Failed to fetch invoice');
        const invoiceData = await invoiceResponse.json();
        setInvoice(invoiceData);
        
        // Fetch job sheet
        const jobSheetResponse = await fetch(`/api/job-sheets/${invoiceData.jobSheetId}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!jobSheetResponse.ok) throw new Error('Failed to fetch job sheet');
        const jobSheetData = await jobSheetResponse.json();
        setJobSheet(jobSheetData);
        
        // Fetch customer
        const customersResponse = await fetch('/api/customers', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!customersResponse.ok) throw new Error('Failed to fetch customers');
        const customersData = await customersResponse.json();
        const customerData = customersData.find(c => c.id === jobSheetData.customerId);
        setCustomer(customerData);
        
        // Fetch vehicle
        const vehiclesResponse = await fetch('/api/vehicles', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!vehiclesResponse.ok) throw new Error('Failed to fetch vehicles');
        const vehiclesData = await vehiclesResponse.json();
        const vehicleData = vehiclesData.find(v => v.id === jobSheetData.vehicleId);
        setVehicle(vehicleData);
        
        // Fetch job items
        const jobItemsResponse = await fetch(`/api/job-items?jobSheetId=${invoiceData.jobSheetId}`, {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!jobItemsResponse.ok) throw new Error('Failed to fetch job items');
        const jobItemsData = await jobItemsResponse.json();
        setJobItems(jobItemsData);
        
        // Fetch user settings
        const settingsResponse = await fetch('/api/settings', {
          headers: {
            Authorization: `Bearer ${session?.access_token}`
          }
        });
        
        if (!settingsResponse.ok) throw new Error('Failed to fetch settings');
        const settingsData = await settingsResponse.json();
        setSettings(settingsData);
        
      } catch (error) {
        console.error('Error fetching invoice data:', error);
        Sentry.captureException(error);
        toast.error('Failed to load invoice details');
        navigate('/invoices');
      } finally {
        setLoading(false);
      }
    };
    
    if (session && id) {
      fetchData();
    }
  }, [session, id, navigate]);

  const handleMarkAsPaid = async () => {
    try {
      setUpdateLoading(true);
      
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'Paid'
        })
      });
      
      if (!response.ok) throw new Error('Failed to update invoice');
      
      const updatedInvoice = await response.json();
      setInvoice(updatedInvoice);
      toast.success('Invoice marked as paid');
    } catch (error) {
      console.error('Error updating invoice:', error);
      Sentry.captureException(error);
      toast.error('Failed to update invoice');
    } finally {
      setUpdateLoading(false);
    }
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Set up defaults
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = margin;
      
      // Helper functions
      const drawText = (text, x, y, size = 10, style = 'normal') => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        doc.text(text, x, y);
      };
      
      // Business information (header)
      if (settings?.logoUrl) {
        try {
          doc.addImage(settings.logoUrl, 'JPEG', margin, yPos, 50, 20);
          yPos += 25;
        } catch (e) {
          console.error('Error adding logo:', e);
        }
      } else {
        drawText(settings?.garageName || 'Your Garage', margin, yPos, 16, 'bold');
        yPos += 7;
      }
      
      drawText(settings?.address || '', margin, yPos, 10);
      yPos += 5;
      if (settings?.phone) {
        drawText(`Phone: ${settings.phone}`, margin, yPos, 10);
        yPos += 5;
      }
      if (settings?.vatNumber) {
        drawText(`VAT: ${settings.vatNumber}`, margin, yPos, 10);
        yPos += 5;
      }
      
      // Invoice details
      yPos += 5;
      drawText(`INVOICE #${invoice.invoiceNumber}`, margin, yPos, 14, 'bold');
      yPos += 7;
      
      drawText(`Date: ${format(new Date(invoice.invoiceDate), 'dd/MM/yyyy')}`, margin, yPos);
      yPos += 5;
      drawText(`Due Date: ${format(new Date(invoice.dueDate), 'dd/MM/yyyy')}`, margin, yPos);
      yPos += 5;
      drawText(`Status: ${invoice.status}`, margin, yPos);
      yPos += 10;
      
      // Customer details
      drawText('BILL TO:', margin, yPos, 12, 'bold');
      yPos += 6;
      drawText(customer?.name || '', margin, yPos);
      yPos += 5;
      drawText(`Phone: ${customer?.phone || ''}`, margin, yPos);
      yPos += 5;
      if (customer?.email) {
        drawText(`Email: ${customer.email}`, margin, yPos);
        yPos += 5;
      }
      
      // Vehicle details
      yPos += 5;
      drawText('VEHICLE:', margin, yPos, 12, 'bold');
      yPos += 6;
      drawText(`Registration: ${vehicle?.registration || ''}`, margin, yPos);
      yPos += 5;
      drawText(`Make/Model: ${vehicle?.make || ''} ${vehicle?.model || ''}`, margin, yPos);
      yPos += 5;
      drawText(`Mileage: ${vehicle?.mileage ? vehicle.mileage.toLocaleString() : ''} miles`, margin, yPos);
      yPos += 10;
      
      // Table headers
      const colWidths = [25, 85, 20, 25, 25];
      const startX = margin;
      let curX = startX;
      
      // Draw table header
      doc.setFillColor(240, 240, 240);
      doc.rect(startX, yPos - 5, pageWidth - (margin * 2), 7, 'F');
      
      drawText('Type', curX, yPos, 10, 'bold');
      curX += colWidths[0];
      
      drawText('Description', curX, yPos, 10, 'bold');
      curX += colWidths[1];
      
      drawText('Qty', curX, yPos, 10, 'bold');
      curX += colWidths[2];
      
      drawText('Unit Price', curX, yPos, 10, 'bold');
      curX += colWidths[3];
      
      drawText('Total', curX, yPos, 10, 'bold');
      
      yPos += 7;
      
      // Draw line below header
      doc.setDrawColor(200, 200, 200);
      doc.line(startX, yPos - 2, pageWidth - margin, yPos - 2);
      
      // Draw table rows
      jobItems.forEach((item, index) => {
        const itemTotal = (parseFloat(item.unitPrice) * parseFloat(item.quantity)).toFixed(2);
        
        // Check if we need to add a new page
        if (yPos > pageHeight - 50) {
          doc.addPage();
          yPos = margin;
        }
        
        curX = startX;
        drawText(item.itemType, curX, yPos, 10);
        curX += colWidths[0];
        
        // Handle long descriptions
        const desc = item.description;
        const maxLineLength = 40; // Characters per line
        
        if (desc.length <= maxLineLength) {
          drawText(desc, curX, yPos, 10);
        } else {
          // Split description into multiple lines
          let remainingText = desc;
          let lineIndex = 0;
          
          while (remainingText.length > 0) {
            let lineText;
            if (remainingText.length <= maxLineLength) {
              lineText = remainingText;
              remainingText = '';
            } else {
              let cutPoint = remainingText.lastIndexOf(' ', maxLineLength);
              if (cutPoint === -1) cutPoint = maxLineLength;
              lineText = remainingText.substring(0, cutPoint);
              remainingText = remainingText.substring(cutPoint + 1);
            }
            
            drawText(lineText, curX, yPos + (lineIndex * 5), 10);
            lineIndex++;
            
            // Check if we need a new page after adding a description line
            if (yPos + (lineIndex * 5) > pageHeight - 50) {
              doc.addPage();
              yPos = margin;
              lineIndex = 0;
            }
          }
          
          // Update yPos for next item
          yPos += (lineIndex - 1) * 5;
        }
        
        curX += colWidths[1];
        drawText(parseFloat(item.quantity).toFixed(2), curX, yPos, 10);
        curX += colWidths[2];
        drawText(`£${parseFloat(item.unitPrice).toFixed(2)}`, curX, yPos, 10);
        curX += colWidths[3];
        drawText(`£${itemTotal}`, curX, yPos, 10);
        
        yPos += 7;
        
        // Draw dividing line
        if (index < jobItems.length - 1) {
          doc.setDrawColor(230, 230, 230);
          doc.line(startX, yPos - 2, pageWidth - margin, yPos - 2);
        }
      });
      
      // Draw totals section
      yPos += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(startX, yPos - 2, pageWidth - margin, yPos - 2);
      yPos += 5;
      
      const subtotalX = pageWidth - margin - 50;
      const valuesX = pageWidth - margin - 20;
      
      drawText('Subtotal:', subtotalX, yPos, 10, 'bold');
      drawText(`£${invoice.subtotal}`, valuesX, yPos, 10);
      yPos += 7;
      
      drawText(`VAT (${jobSheet?.isVatExempt ? 'Exempt' : '20%'}):`, subtotalX, yPos, 10, 'bold');
      drawText(`£${invoice.vatAmount}`, valuesX, yPos, 10);
      yPos += 7;
      
      // Total with box
      doc.setFillColor(240, 240, 240);
      doc.rect(subtotalX - 10, yPos - 5, 60, 7, 'F');
      
      drawText('TOTAL:', subtotalX, yPos, 11, 'bold');
      drawText(`£${invoice.total}`, valuesX, yPos, 11, 'bold');
      yPos += 12;
      
      // Notes and payment instructions
      if (invoice.notes) {
        drawText('Notes:', margin, yPos, 11, 'bold');
        yPos += 6;
        
        // Handle multi-line notes
        const notes = invoice.notes.split('\n');
        notes.forEach(line => {
          if (yPos > pageHeight - 30) {
            doc.addPage();
            yPos = margin;
          }
          
          drawText(line, margin, yPos, 10);
          yPos += 5;
        });
        
        yPos += 5;
      }
      
      if (invoice.paymentInstructions) {
        drawText('Payment Instructions:', margin, yPos, 11, 'bold');
        yPos += 6;
        
        // Handle multi-line payment instructions
        const instructions = invoice.paymentInstructions.split('\n');
        instructions.forEach(line => {
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = margin;
          }
          
          drawText(line, margin, yPos, 10);
          yPos += 5;
        });
      }
      
      // Save the PDF
      doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      Sentry.captureException(error);
      toast.error('Failed to generate PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  if (!invoice || !jobSheet || !customer || !vehicle) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> Invoice or related data not found.</span>
        </div>
        <Link to="/invoices" className="mt-4 text-primary-600 hover:text-primary-800 inline-block">
          <FiArrowLeft className="inline mr-1" /> Back to Invoices
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center mb-4 sm:mb-0">
          <Link to="/invoices" className="text-primary-600 hover:text-primary-800 mr-4">
            <FiArrowLeft className="inline mr-1" /> Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            Invoice #{invoice.invoiceNumber}
          </h1>
          <span className={`ml-4 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
            invoice.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {invoice.status}
          </span>
        </div>
        
        <div className="flex space-x-2">
          {invoice.status !== 'Paid' && (
            <button 
              onClick={handleMarkAsPaid} 
              className="btn-primary flex items-center cursor-pointer"
              disabled={updateLoading}
            >
              {updateLoading ? (
                <span className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
              ) : (
                <FiCheck className="mr-2" />
              )}
              Mark as Paid
            </button>
          )}
          
          <button 
            onClick={generatePDF} 
            className="btn-secondary flex items-center cursor-pointer"
          >
            <FiDownload className="mr-2" /> Download PDF
          </button>
          
          <button 
            onClick={() => window.print()} 
            className="btn-secondary flex items-center cursor-pointer"
          >
            <FiPrinter className="mr-2" /> Print
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden print:shadow-none" ref={invoiceRef}>
        <div className="p-8">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">INVOICE</h2>
              <p className="text-gray-600">{invoice.invoiceNumber}</p>
            </div>
            
            <div className="text-right">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Business Logo" className="h-16 object-contain mb-2" />
              ) : (
                <h3 className="text-xl font-bold mb-2">{settings?.garageName || 'Your Garage'}</h3>
              )}
              <p className="text-gray-600 whitespace-pre-line">{settings?.address}</p>
              {settings?.phone && <p className="text-gray-600">Phone: {settings.phone}</p>}
              {settings?.vatNumber && <p className="text-gray-600">VAT: {settings.vatNumber}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-gray-600 font-medium mb-2">Bill To:</h3>
              <p className="font-medium text-gray-800">{customer.name}</p>
              <p className="text-gray-600">Phone: {customer.phone}</p>
              {customer.email && <p className="text-gray-600">Email: {customer.email}</p>}
            </div>
            
            <div>
              <h3 className="text-gray-600 font-medium mb-2">Invoice Details:</h3>
              <div className="grid grid-cols-2 gap-x-4">
                <p className="text-gray-600">Issue Date:</p>
                <p className="text-gray-800">{format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}</p>
                
                <p className="text-gray-600">Due Date:</p>
                <p className="text-gray-800">{format(new Date(invoice.dueDate), 'dd MMM yyyy')}</p>
                
                <p className="text-gray-600">Status:</p>
                <p className={`${
                  invoice.status === 'Paid' ? 'text-green-600' :
                  invoice.status === 'Cancelled' ? 'text-red-600' :
                  'text-yellow-600'
                } font-medium`}>
                  {invoice.status}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <h3 className="text-gray-600 font-medium mb-2">Vehicle:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-gray-600">Registration:</p>
                <p className="text-gray-800 font-medium">{vehicle.registration}</p>
              </div>
              <div>
                <p className="text-gray-600">Make/Model:</p>
                <p className="text-gray-800">{vehicle.make} {vehicle.model}</p>
              </div>
              <div>
                <p className="text-gray-600">Mileage:</p>
                <p className="text-gray-800">{vehicle.mileage.toLocaleString()} miles</p>
              </div>
            </div>
          </div>
          
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-2 text-left text-gray-600">Item Type</th>
                <th className="py-3 px-2 text-left text-gray-600">Description</th>
                <th className="py-3 px-2 text-right text-gray-600">Qty</th>
                <th className="py-3 px-2 text-right text-gray-600">Unit Price</th>
                <th className="py-3 px-2 text-right text-gray-600">VAT</th>
                <th className="py-3 px-2 text-right text-gray-600">Total</th>
              </tr>
            </thead>
            <tbody>
              {jobItems.map(item => {
                const itemSubtotal = (parseFloat(item.unitPrice) * parseFloat(item.quantity)).toFixed(2);
                const itemVat = jobSheet.isVatExempt ? 0 : (parseFloat(itemSubtotal) * (parseFloat(item.vatRate) / 100)).toFixed(2);
                const itemTotal = (parseFloat(itemSubtotal) + parseFloat(itemVat)).toFixed(2);
                
                return (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-3 px-2 text-gray-800">{item.itemType}</td>
                    <td className="py-3 px-2 text-gray-800">{item.description}</td>
                    <td className="py-3 px-2 text-right text-gray-800">{parseFloat(item.quantity).toFixed(2)}</td>
                    <td className="py-3 px-2 text-right text-gray-800">£{parseFloat(item.unitPrice).toFixed(2)}</td>
                    <td className="py-3 px-2 text-right text-gray-800">
                      {jobSheet.isVatExempt ? 'Exempt' : `${parseFloat(item.vatRate).toFixed(0)}%`}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-800 font-medium">£{itemTotal}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div className="flex justify-end mb-8">
            <div className="w-full md:w-1/3">
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-medium text-gray-600">Subtotal:</span>
                <span className="text-gray-800">£{invoice.subtotal}</span>
              </div>
              
              <div className="flex justify-between py-2 border-b border-gray-200">
                <span className="font-medium text-gray-600">
                  VAT ({jobSheet.isVatExempt ? 'Exempt' : '20%'}):
                </span>
                <span className="text-gray-800">£{invoice.vatAmount}</span>
              </div>
              
              <div className="flex justify-between py-2 text-lg font-bold">
                <span className="text-gray-800">Total:</span>
                <span className="text-gray-800">£{invoice.total}</span>
              </div>
            </div>
          </div>
          
          {invoice.notes && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-800 mb-2">Notes:</h3>
              <p className="text-gray-600 whitespace-pre-line">{invoice.notes}</p>
            </div>
          )}
          
          {invoice.paymentInstructions && (
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Payment Instructions:</h3>
              <p className="text-gray-600 whitespace-pre-line">{invoice.paymentInstructions}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetail;