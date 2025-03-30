import { authenticateUser, db } from "../_apiUtils.js";
import { jobSheets } from "../../drizzle/schema.js";
import { eq, and } from 'drizzle-orm';
import * as Sentry from "@sentry/node";

export default async function handler(req, res) {
  try {
    console.log(`Job Sheet ${req.query.id} API called:`, req.method);
    const user = await authenticateUser(req);
    const id = parseInt(req.query.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid job sheet ID' });
    }
    
    // Check if job sheet exists and belongs to user
    const jobSheet = await db.select()
      .from(jobSheets)
      .where(
        and(
          eq(jobSheets.id, id),
          eq(jobSheets.userId, user.id)
        )
      );
    
    if (jobSheet.length === 0) {
      return res.status(404).json({ error: 'Job sheet not found or not authorized' });
    }
    
    if (req.method === 'GET') {
      return res.status(200).json(jobSheet[0]);
    }
    
    if (req.method === 'PUT') {
      console.log(`Updating job sheet ${id}`, req.body);
      const { 
        dateIn, dateOut, reportedProblems, diagnosis, 
        technicianName, status, isVatExempt
      } = req.body;
      
      const result = await db.update(jobSheets)
        .set({
          dateIn: dateIn ? new Date(dateIn) : undefined,
          dateOut: dateOut ? new Date(dateOut) : null,
          reportedProblems: reportedProblems || null,
          diagnosis: diagnosis || null,
          technicianName: technicianName || null,
          status: status || undefined,
          isVatExempt: isVatExempt !== undefined ? isVatExempt : undefined,
          updatedAt: new Date(),
        })
        .where(and(
          eq(jobSheets.id, id),
          eq(jobSheets.userId, user.id)
        ))
        .returning();
      
      return res.status(200).json(result[0]);
    }
    
    if (req.method === 'DELETE') {
      await db.delete(jobSheets)
        .where(and(
          eq(jobSheets.id, id),
          eq(jobSheets.userId, user.id)
        ));
      
      return res.status(200).json({ message: 'Job sheet deleted successfully' });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in job-sheet API:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}