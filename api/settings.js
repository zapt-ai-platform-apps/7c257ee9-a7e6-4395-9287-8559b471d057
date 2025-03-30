import { authenticateUser, db } from "./_apiUtils.js";
import { users } from "../drizzle/schema.js";
import { eq } from 'drizzle-orm';
import * as Sentry from "@sentry/node";

export default async function handler(req, res) {
  try {
    console.log("Settings API called:", req.method);
    const user = await authenticateUser(req);
    
    if (req.method === 'GET') {
      console.log(`Getting settings for user ${user.id}`);
      
      const result = await db.select().from(users).where(eq(users.id, user.id));
      
      if (result.length === 0) {
        // Create default settings
        const newUser = await db.insert(users).values({
          id: user.id,
          email: user.email,
        }).returning();
        
        return res.status(200).json(newUser[0]);
      }
      
      return res.status(200).json(result[0]);
    } 
    
    if (req.method === 'POST') {
      console.log(`Updating settings for user ${user.id}`, req.body);
      const { 
        garageName, address, phone, vatNumber, hourlyRate,
        invoicePrefix, paymentTerms, defaultNotes, logoUrl
      } = req.body;
      
      // Check if user exists
      const existingUser = await db.select().from(users).where(eq(users.id, user.id));
      
      if (existingUser.length === 0) {
        // Create new user with settings
        const newUser = await db.insert(users).values({
          id: user.id,
          email: user.email,
          garageName,
          address,
          phone,
          vatNumber,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : 60.00,
          invoicePrefix: invoicePrefix || 'INV-',
          paymentTerms: paymentTerms || 'Due within 14 days',
          defaultNotes,
          logoUrl,
        }).returning();
        
        return res.status(201).json(newUser[0]);
      } else {
        // Update existing user settings
        const updatedUser = await db.update(users)
          .set({
            garageName,
            address,
            phone,
            vatNumber,
            hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
            invoicePrefix: invoicePrefix || undefined,
            paymentTerms: paymentTerms || undefined,
            defaultNotes,
            logoUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))
          .returning();
        
        return res.status(200).json(updatedUser[0]);
      }
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in settings API:', error);
    Sentry.captureException(error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}