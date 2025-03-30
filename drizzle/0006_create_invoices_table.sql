CREATE TABLE IF NOT EXISTS "invoices" (
  "id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "job_sheet_id" INTEGER NOT NULL REFERENCES "job_sheets"("id") ON DELETE CASCADE,
  "invoice_number" TEXT NOT NULL,
  "invoice_date" DATE NOT NULL,
  "due_date" DATE NOT NULL,
  "subtotal" DECIMAL(10, 2) NOT NULL,
  "vat_amount" DECIMAL(10, 2) NOT NULL,
  "total" DECIMAL(10, 2) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'Unpaid',
  "notes" TEXT,
  "payment_instructions" TEXT,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);