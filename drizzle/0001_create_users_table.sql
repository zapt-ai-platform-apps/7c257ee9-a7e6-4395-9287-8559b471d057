CREATE TABLE IF NOT EXISTS "users" (
  "id" UUID PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW(),
  "garage_name" TEXT,
  "address" TEXT,
  "phone" TEXT,
  "vat_number" TEXT,
  "hourly_rate" DECIMAL(10, 2) DEFAULT 60.00,
  "invoice_prefix" TEXT DEFAULT 'INV-',
  "payment_terms" TEXT DEFAULT 'Due within 14 days',
  "default_notes" TEXT,
  "logo_url" TEXT
);