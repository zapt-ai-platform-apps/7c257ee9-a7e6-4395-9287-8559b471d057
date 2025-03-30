CREATE TABLE IF NOT EXISTS "job_sheets" (
  "id" SERIAL PRIMARY KEY,
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "customer_id" INTEGER NOT NULL REFERENCES "customers"("id") ON DELETE CASCADE,
  "vehicle_id" INTEGER NOT NULL REFERENCES "vehicles"("id") ON DELETE CASCADE,
  "date_in" DATE NOT NULL,
  "date_out" DATE,
  "reported_problems" TEXT,
  "diagnosis" TEXT,
  "technician_name" TEXT,
  "status" TEXT NOT NULL DEFAULT 'Draft',
  "is_vat_exempt" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);