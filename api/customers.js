import { authenticateUser, db } from "./_apiUtils.js";
import { customers } from "../drizzle/schema.js";
import { eq } from 'drizzle-orm';
import * as Sentry from "@sentry/node";

export default async function handler(req, res) {
  try {
    console.log("Customers API called:", req.method);
    const user = await authenticateUser(req);
    
    if (req.method === 'GET') {
      console.log(`Getting customers for user ${user.id}`);
      const result = await db.select().from(customers).where(eq(customers.userId, user.id));
      return res.status(200).json(result);
    } 
    
    if (req.method === 'POST') {
      console.log(`Creating new customer for user ${user.id}`, req.body);
      const { name, phone, email } = req.body;
      
      if (!name || !phone) {
        return res.status(400).json({ error: 'Name and phone are required' });
      }
      
      const result = await db.insert(customers).values({
        userId: user.id,
        name,
        phone,
        email: email || null,
      }).returning();
      
      return res.status(201).json(result[0]);
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in customers API:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}