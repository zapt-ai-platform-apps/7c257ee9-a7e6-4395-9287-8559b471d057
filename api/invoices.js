import { authenticateUser, db } from "./_apiUtils.js";
import { invoices, jobSheets } from "../drizzle/schema.js";
import { eq, and } from 'drizzle-orm';
import * as Sentry from "@sentry/node";

export default async function handler(req, res) {
  try {
    console.log("Invoices API called:", req.method);
    const user = await authenticateUser(req);
    
    if (req.method === 'GET') {
      console.log(`Getting invoices for user ${user.id}`);
      
      const jobSheetId = req.query.jobSheetId;
      let query = eq(invoices.userId, user.id);
      
      if (jobSheetId) {
        query = and(query, eq(invoices.jobSheetId, parseInt(jobSheetId)));
      }
      
      const result = await db.select().from(invoices).where(query);
      return res.status(200).json(result);
    } 
    
    if (req.method === 'POST') {
      console.log(`Creating new invoice`, req.body);
      const { 
        jobSheetId, invoiceNumber, invoiceDate, dueDate, 
        subtotal, vatAmount, total, notes, paymentInstructions
      } = req.body;
      
      if (!jobSheetId || !invoiceNumber || !invoiceDate || !subtotal || !total) {
        return res.status(400).json({ error: 'Required fields missing' });
      }
      
      // Verify job sheet belongs to user
      const jobSheetCheck = await db.select().from(jobSheets)
        .where(and(
          eq(jobSheets.id, parseInt(jobSheetId)),
          eq(jobSheets.userId, user.id)
        ));
      
      if (jobSheetCheck.length === 0) {
        return res.status(403).json({ error: 'Job sheet not found or not authorized' });
      }
      
      // Check if job sheet already has an invoice
      const existingInvoice = await db.select().from(invoices)
        .where(eq(invoices.jobSheetId, parseInt(jobSheetId)));
      
      if (existingInvoice.length > 0) {
        return res.status(400).json({ error: 'Job sheet already has an invoice' });
      }
      
      // Update job sheet status to Completed
      await db.update(jobSheets)
        .set({ status: 'Completed' })
        .where(eq(jobSheets.id, parseInt(jobSheetId)));
      
      const result = await db.insert(invoices).values({
        userId: user.id,
        jobSheetId: parseInt(jobSheetId),
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        subtotal: parseFloat(subtotal),
        vatAmount: parseFloat(vatAmount || 0),
        total: parseFloat(total),
        notes: notes || null,
        paymentInstructions: paymentInstructions || null,
      }).returning();
      
      return res.status(201).json(result[0]);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in invoices API:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}