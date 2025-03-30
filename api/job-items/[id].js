import { authenticateUser, db } from "../_apiUtils.js";
import { jobItems, jobSheets } from "../../drizzle/schema.js";
import { eq, and } from 'drizzle-orm';
import * as Sentry from "@sentry/node";

export default async function handler(req, res) {
  try {
    console.log(`Job Item ${req.query.id} API called:`, req.method);
    const user = await authenticateUser(req);
    const id = parseInt(req.query.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid job item ID' });
    }
    
    // Get job item
    const jobItem = await db.select()
      .from(jobItems)
      .where(eq(jobItems.id, id));
    
    if (jobItem.length === 0) {
      return res.status(404).json({ error: 'Job item not found' });
    }
    
    // Verify job sheet belongs to user
    const jobSheetCheck = await db.select()
      .from(jobSheets)
      .where(and(
        eq(jobSheets.id, jobItem[0].jobSheetId),
        eq(jobSheets.userId, user.id)
      ));
    
    if (jobSheetCheck.length === 0) {
      return res.status(403).json({ error: 'Not authorized to access this job item' });
    }
    
    if (req.method === 'PUT') {
      console.log(`Updating job item ${id}`, req.body);
      const { jobSheetId, itemType, description, quantity, unitPrice, vatRate } = req.body;
      
      if (!itemType || !description || !unitPrice) {
        return res.status(400).json({ error: 'Required fields missing' });
      }
      
      const result = await db.update(jobItems)
        .set({
          itemType,
          description,
          quantity: parseFloat(quantity) || 1,
          unitPrice: parseFloat(unitPrice),
          vatRate: vatRate !== undefined ? parseFloat(vatRate) : 20.0,
          updatedAt: new Date(),
        })
        .where(eq(jobItems.id, id))
        .returning();
      
      return res.status(200).json(result[0]);
    }
    
    if (req.method === 'DELETE') {
      await db.delete(jobItems)
        .where(eq(jobItems.id, id));
      
      return res.status(200).json({ message: 'Job item deleted successfully' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in job-item API:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}