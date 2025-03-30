import { authenticateUser, db } from "./_apiUtils.js";
import { vehicles, customers } from "../drizzle/schema.js";
import { eq, and } from 'drizzle-orm';
import * as Sentry from "@sentry/node";

export default async function handler(req, res) {
  try {
    console.log("Vehicles API called:", req.method);
    const user = await authenticateUser(req);
    
    if (req.method === 'GET') {
      console.log(`Getting vehicles for user ${user.id}`);
      
      const customerId = req.query.customerId;
      let query = eq(vehicles.userId, user.id);
      
      if (customerId) {
        query = and(query, eq(vehicles.customerId, parseInt(customerId)));
      }
      
      const result = await db.select().from(vehicles).where(query);
      return res.status(200).json(result);
    } 
    
    if (req.method === 'POST') {
      console.log(`Creating new vehicle for user ${user.id}`, req.body);
      const { customerId, registration, make, model, vin, mileage, fuelType, motDueDate } = req.body;
      
      if (!customerId || !registration || !make || !model || !mileage || !fuelType) {
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
      
      const result = await db.insert(vehicles).values({
        userId: user.id,
        customerId: parseInt(customerId),
        registration,
        make,
        model,
        vin: vin || null,
        mileage: parseInt(mileage),
        fuelType,
        motDueDate: motDueDate || null,
      }).returning();
      
      return res.status(201).json(result[0]);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in vehicles API:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}