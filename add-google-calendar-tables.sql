-- Add Google Calendar integration tables
-- Safe to run - only adds new tables, doesn't modify existing ones

-- GoogleCalendarAuth table
CREATE TABLE IF NOT EXISTS "GoogleCalendarAuth" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL DEFAULT 'Bearer',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "scope" TEXT NOT NULL,
    "calendarId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "GoogleCalendarAuth_userId_idx" ON "GoogleCalendarAuth"("userId");
CREATE INDEX IF NOT EXISTS "GoogleCalendarAuth_expiresAt_idx" ON "GoogleCalendarAuth"("expiresAt");

-- SyncStatus table
CREATE TABLE IF NOT EXISTS "SyncStatus" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL UNIQUE,
    "lastSyncAt" TIMESTAMP(3),
    "lastSyncStatus" TEXT NOT NULL DEFAULT 'never_synced',
    "lastSyncError" TEXT,
    "totalEventsSynced" INTEGER NOT NULL DEFAULT 0,
    "syncInProgress" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "SyncStatus_userId_idx" ON "SyncStatus"("userId");
CREATE INDEX IF NOT EXISTS "SyncStatus_lastSyncAt_idx" ON "SyncStatus"("lastSyncAt");

-- CalendarEventMapping table
CREATE TABLE IF NOT EXISTS "CalendarEventMapping" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "custodyEventId" TEXT NOT NULL,
    "googleEventId" TEXT NOT NULL,
    "calendarId" TEXT NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL,
    "syncStatus" TEXT NOT NULL DEFAULT 'synced',
    "localLastUpdated" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("custodyEventId", "googleEventId")
);

CREATE INDEX IF NOT EXISTS "CalendarEventMapping_custodyEventId_idx" ON "CalendarEventMapping"("custodyEventId");
CREATE INDEX IF NOT EXISTS "CalendarEventMapping_googleEventId_idx" ON "CalendarEventMapping"("googleEventId");
CREATE INDEX IF NOT EXISTS "CalendarEventMapping_syncStatus_idx" ON "CalendarEventMapping"("syncStatus");

-- Add other missing tables from schema (Holiday, ScheduleRule)
CREATE TABLE IF NOT EXISTS "Holiday" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "yearParity" TEXT NOT NULL,
    "parent" TEXT NOT NULL,
    "dateRule" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("name", "yearParity")
);

CREATE TABLE IF NOT EXISTS "ScheduleRule" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "ruleType" TEXT NOT NULL,
    "parent" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pattern" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Rename custody_events to CustodyEvent if needed to match Prisma schema
-- Note: This is optional - Prisma uses the model name, PostgreSQL table names are case-insensitive
-- unless quoted, so we may need to check if this is an issue
