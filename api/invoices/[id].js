import { authenticateUser, db } from "../_apiUtils.js";
import { invoices } from "../../drizzle/schema.js";
import { eq, and } from 'drizzle-orm';
import * as Sentry from "@sentry/node";

export default async function handler(req, res) {
  try {
    console.log(`Invoice ${req.query.id} API called:`, req.method);
    const user = await authenticateUser(req);
    const id = parseInt(req.query.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid invoice ID' });
    }
    
    // Check if invoice exists and belongs to user
    const invoice = await db.select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, id),
          eq(invoices.userId, user.id)
        )
      );
    
    if (invoice.length === 0) {
      return res.status(404).json({ error: 'Invoice not found or not authorized' });
    }
    
    if (req.method === 'GET') {
      return res.status(200).json(invoice[0]);
    }
    
    if (req.method === 'PUT') {
      console.log(`Updating invoice ${id}`, req.body);
      const { status, notes, paymentInstructions } = req.body;
      
      const result = await db.update(invoices)
        .set({
          status: status || undefined,
          notes: notes !== undefined ? notes : undefined,
          paymentInstructions: paymentInstructions !== undefined ? paymentInstructions : undefined,
          updatedAt: new Date(),
        })
        .where(and(
          eq(invoices.id, id),
          eq(invoices.userId, user.id)
        ))
        .returning();
      
      return res.status(200).json(result[0]);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in invoice API:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}