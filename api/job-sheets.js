import { authenticateUser, db } from "./_apiUtils.js";
import { jobSheets, customers, vehicles } from "../drizzle/schema.js";
import { eq, and } from 'drizzle-orm';
import * as Sentry from "@sentry/node";

export default async function handler(req, res) {
  try {
    console.log("Job Sheets API called:", req.method);
    const user = await authenticateUser(req);
    
    if (req.method === 'GET') {
      console.log(`Getting job sheets for user ${user.id}`);
      const result = await db.select().from(jobSheets).where(eq(jobSheets.userId, user.id));
      return res.status(200).json(result);
    } 
    
    if (req.method === 'POST') {
      console.log(`Creating new job sheet for user ${user.id}`, req.body);
      const { 
        customerId, vehicleId, dateIn, dateOut, reportedProblems, 
        diagnosis, technicianName, status, isVatExempt
      } = req.body;
      
      if (!customerId || !vehicleId || !dateIn) {
        return res.status(400).json({ error: 'Required fields missing' });
      }
      
      // Verify customer belongs to user
      const customerCheck = await db.select().from(customers)
        .where(and(
          eq(customers.id, parseInt(customerId)),
          eq(customers.userId, user.id)
        ));
      
      if (customerCheck.length === 0) {
        return res.status(403).json({ error: 'Customer not found or not authorized' });
      }
      
      // Verify vehicle belongs to user and customer
      const vehicleCheck = await db.select().from(vehicles)
        .where(and(
          eq(vehicles.id, parseInt(vehicleId)),
          eq(vehicles.userId, user.id),
          eq(vehicles.customerId, parseInt(customerId))
        ));
      
      if (vehicleCheck.length === 0) {
        return res.status(403).json({ error: 'Vehicle not found or not authorized' });
      }
      
      const result = await db.insert(jobSheets).values({
        userId: user.id,
        customerId: parseInt(customerId),
        vehicleId: parseInt(vehicleId),
        dateIn: new Date(dateIn),
        dateOut: dateOut ? new Date(dateOut) : null,
        reportedProblems: reportedProblems || null,
        diagnosis: diagnosis || null,
        technicianName: technicianName || null,
        status: status || 'Draft',
        isVatExempt: isVatExempt || false,
      }).returning();
      
      return res.status(201).json(result[0]);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in job-sheets API:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}