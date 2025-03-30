CREATE TABLE IF NOT EXISTS "attachments" (
  "id" SERIAL PRIMARY KEY,
  "job_sheet_id" INTEGER NOT NULL REFERENCES "job_sheets"("id") ON DELETE CASCADE,
  "file_name" TEXT NOT NULL,
  "file_url" TEXT NOT NULL,
  "file_type" TEXT NOT NULL,
  "created_at" TIMESTAMP DEFAULT NOW()
);