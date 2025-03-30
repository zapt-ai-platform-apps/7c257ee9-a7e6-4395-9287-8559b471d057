import { authenticateUser, db } from "./_apiUtils.js";
import { jobItems, jobSheets } from "../drizzle/schema.js";
import { eq, and } from 'drizzle-orm';
import * as Sentry from "@sentry/node";

export default async function handler(req, res) {
  try {
    console.log("Job Items API called:", req.method);
    const user = await authenticateUser(req);
    
    if (req.method === 'GET') {
      console.log(`Getting job items for job sheet ${req.query.jobSheetId}`);
      
      const jobSheetId = req.query.jobSheetId;
      if (!jobSheetId) {
        return res.status(400).json({ error: 'Job sheet ID is required' });
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
      
      const result = await db.select().from(jobItems)
        .where(eq(jobItems.jobSheetId, parseInt(jobSheetId)));
      
      return res.status(200).json(result);
    } 
    
    if (req.method === 'POST') {
      console.log(`Creating new job item`, req.body);
      const { jobSheetId, itemType, description, quantity, unitPrice, vatRate } = req.body;
      
      if (!jobSheetId || !itemType || !description || !unitPrice) {
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
      
      const result = await db.insert(jobItems).values({
        jobSheetId: parseInt(jobSheetId),
        itemType,
        description,
        quantity: quantity || 1,
        unitPrice: parseFloat(unitPrice),
        vatRate: vatRate !== undefined ? parseFloat(vatRate) : 20.0,
      }).returning();
      
      return res.status(201).json(result[0]);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in job-items API:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}