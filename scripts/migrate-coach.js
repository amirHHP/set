const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Connected to Postgres');

  await client.query(`
    -- Alter User table
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coachCode" TEXT;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coachBio" TEXT;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coachPhone" TEXT;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coachWelcomeMessage" TEXT;
    ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "coachId" TEXT;

    -- Add unique constraint on coachCode if not exists
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_coachCode_key') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_coachCode_key" UNIQUE ("coachCode");
      END IF;
    END $$;

    -- Add foreign key constraint for coachId
    DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'User_coachId_fkey') THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE SET NULL;
      END IF;
    END $$;

    -- Create indexes
    CREATE INDEX IF NOT EXISTS "User_coachCode_idx" ON "User"("coachCode");
    CREATE INDEX IF NOT EXISTS "User_coachId_idx" ON "User"("coachId");

    -- Create CoachNote table
    CREATE TABLE IF NOT EXISTS "CoachNote" (
      "id" TEXT PRIMARY KEY,
      "coachId" TEXT NOT NULL,
      "traineeId" TEXT NOT NULL,
      "note" TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "CoachNote_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE,
      CONSTRAINT "CoachNote_traineeId_fkey" FOREIGN KEY ("traineeId") REFERENCES "User"("id") ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS "CoachNote_coachId_idx" ON "CoachNote"("coachId");
    CREATE INDEX IF NOT EXISTS "CoachNote_traineeId_idx" ON "CoachNote"("traineeId");
  `);

  console.log('Coach schema migrated successfully!');
  await client.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
