CREATE TABLE IF NOT EXISTS "job_items" (
  "id" SERIAL PRIMARY KEY,
  "job_sheet_id" INTEGER NOT NULL REFERENCES "job_sheets"("id") ON DELETE CASCADE,
  "item_type" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" DECIMAL(10, 2) NOT NULL DEFAULT 1,
  "unit_price" DECIMAL(10, 2) NOT NULL,
  "vat_rate" DECIMAL(10, 2) NOT NULL DEFAULT 20.00,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);