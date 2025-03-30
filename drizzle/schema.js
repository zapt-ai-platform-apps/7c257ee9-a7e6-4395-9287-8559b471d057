import { pgTable, uuid, text, timestamp, serial, integer, numeric, boolean, date } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  garageName: text('garage_name'),
  address: text('address'),
  phone: text('phone'),
  vatNumber: text('vat_number'),
  hourlyRate: numeric('hourly_rate', { precision: 10, scale: 2 }).default('60.00'),
  invoicePrefix: text('invoice_prefix').default('INV-'),
  paymentTerms: text('payment_terms').default('Due within 14 days'),
  defaultNotes: text('default_notes'),
  logoUrl: text('logo_url')
});

export const customers = pgTable('customers', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  customerId: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  registration: text('registration').notNull(),
  make: text('make').notNull(),
  model: text('model').notNull(),
  vin: text('vin'),
  mileage: integer('mileage').notNull(),
  fuelType: text('fuel_type').notNull(),
  motDueDate: date('mot_due_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const jobSheets = pgTable('job_sheets', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  customerId: integer('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  vehicleId: integer('vehicle_id').notNull().references(() => vehicles.id, { onDelete: 'cascade' }),
  dateIn: date('date_in').notNull(),
  dateOut: date('date_out'),
  reportedProblems: text('reported_problems'),
  diagnosis: text('diagnosis'),
  technicianName: text('technician_name'),
  status: text('status').notNull().default('Draft'),
  isVatExempt: boolean('is_vat_exempt').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const jobItems = pgTable('job_items', {
  id: serial('id').primaryKey(),
  jobSheetId: integer('job_sheet_id').notNull().references(() => jobSheets.id, { onDelete: 'cascade' }),
  itemType: text('item_type').notNull(),
  description: text('description').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('1'),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  vatRate: numeric('vat_rate', { precision: 10, scale: 2 }).notNull().default('20.00'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobSheetId: integer('job_sheet_id').notNull().references(() => jobSheets.id, { onDelete: 'cascade' }),
  invoiceNumber: text('invoice_number').notNull(),
  invoiceDate: date('invoice_date').notNull(),
  dueDate: date('due_date').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  vatAmount: numeric('vat_amount', { precision: 10, scale: 2 }).notNull(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  status: text('status').notNull().default('Unpaid'),
  notes: text('notes'),
  paymentInstructions: text('payment_instructions'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const attachments = pgTable('attachments', {
  id: serial('id').primaryKey(),
  jobSheetId: integer('job_sheet_id').notNull().references(() => jobSheets.id, { onDelete: 'cascade' }),
  fileName: text('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: text('file_type').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});