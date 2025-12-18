import { google, calendar_v3 } from 'googleapis';
import { getAuthenticatedClient, getStoredTokens } from './google-auth';
import { prisma } from './prisma';

export interface CustodyEvent {
  id: string;
  startDate: Date;
  endDate: Date;
  custodyType: string;
  parent: string;
  title: string;
  description: string | null;
  priority: number;
  updatedAt: Date;
}

export interface SyncResult {
  success: boolean;
  totalEvents: number;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}

/**
 * Gets or creates a dedicated custody calendar
 */
export async function getOrCreateCustodyCalendar(
  userId: string
): Promise<string> {
  const oauth2Client = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // Check if we already have a calendar ID stored
  const storedAuth = await getStoredTokens(userId);
  if (storedAuth?.calendarId) {
    try {
      // Verify calendar still exists
      await calendar.calendars.get({ calendarId: storedAuth.calendarId });
      return storedAuth.calendarId;
    } catch (error) {
      console.log('Stored calendar not found, creating new one');
    }
  }

  // Create new calendar
  const calendarName = 'Custody Calendar';
  const calendarDescription = 'Synchronized custody schedule';

  try {
    const response = await calendar.calendars.insert({
      requestBody: {
        summary: calendarName,
        description: calendarDescription,
        timeZone: 'America/Los_Angeles', // Adjust as needed
      },
    });

    const calendarId = response.data.id!;

    // Store calendar ID
    await prisma.googleCalendarAuth.update({
      where: { userId },
      data: { calendarId },
    });

    return calendarId;
  } catch (error) {
    console.error('Error creating calendar:', error);
    throw new Error('Failed to create Google Calendar');
  }
}

/**
 * Converts custody event to Google Calendar event format
 */
function custodyEventToGoogleEvent(
  event: CustodyEvent
): calendar_v3.Schema$Event {
  // Set color based on parent
  const colorId = event.parent === 'mother' ? '9' : '11'; // Blue for mother, red for father

  return {
    summary: event.title,
    description: event.description || `Custody: ${event.custodyType}`,
    start: {
      dateTime: event.startDate.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: event.endDate.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    colorId,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 }, // 1 hour before
      ],
    },
    extendedProperties: {
      private: {
        custodyEventId: event.id,
        custodyType: event.custodyType,
        parent: event.parent,
        priority: event.priority.toString(),
      },
    },
  };
}

/**
 * Syncs all custody events to Google Calendar
 */
export async function syncAllEvents(userId: string): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    totalEvents: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    errors: [],
  };

  try {
    // Mark sync as in progress
    await prisma.syncStatus.upsert({
      where: { userId },
      update: { syncInProgress: true },
      create: { userId, syncInProgress: true },
    });

    const oauth2Client = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarId = await getOrCreateCustodyCalendar(userId);

    // Get all custody events
    const custodyEvents = await prisma.custodyEvent.findMany({
      orderBy: { startDate: 'asc' },
    });

    result.totalEvents = custodyEvents.length;

    // Get existing mappings
    const existingMappings = await prisma.calendarEventMapping.findMany();
    const mappingsByCustodyId = new Map(
      existingMappings.map((m) => [m.custodyEventId, m])
    );

    // Sync each event
    for (const custodyEvent of custodyEvents) {
      try {
        const mapping = mappingsByCustodyId.get(custodyEvent.id);
        const googleEvent = custodyEventToGoogleEvent(custodyEvent);

        if (!mapping) {
          // Create new event
          const response = await calendar.events.insert({
            calendarId,
            requestBody: googleEvent,
          });

          if (response.data.id) {
            await prisma.calendarEventMapping.create({
              data: {
                custodyEventId: custodyEvent.id,
                googleEventId: response.data.id,
                calendarId,
                lastSyncedAt: new Date(),
                syncStatus: 'synced',
                localLastUpdated: custodyEvent.updatedAt,
              },
            });

            result.created++;
          }
        } else {
          // Check if event needs update
          if (
            custodyEvent.updatedAt.getTime() >
            mapping.localLastUpdated.getTime()
          ) {
            await calendar.events.update({
              calendarId,
              eventId: mapping.googleEventId,
              requestBody: googleEvent,
            });

            await prisma.calendarEventMapping.update({
              where: { id: mapping.id },
              data: {
                lastSyncedAt: new Date(),
                syncStatus: 'synced',
                localLastUpdated: custodyEvent.updatedAt,
              },
            });

            result.updated++;
          }

          // Remove from map to track deletions
          mappingsByCustodyId.delete(custodyEvent.id);
        }
      } catch (error) {
        console.error(`Error syncing event ${custodyEvent.id}:`, error);
        result.errors.push(
          `Failed to sync event "${custodyEvent.title}": ${error}`
        );
      }
    }

    // Delete events that no longer exist in custody calendar
    const orphanedMappings = Array.from(mappingsByCustodyId.entries());
    for (const [custodyEventId, mapping] of orphanedMappings) {
      try {
        await calendar.events.delete({
          calendarId: mapping.calendarId,
          eventId: mapping.googleEventId,
        });

        await prisma.calendarEventMapping.delete({
          where: { id: mapping.id },
        });

        result.deleted++;
      } catch (error) {
        console.error(`Error deleting event ${custodyEventId}:`, error);
        result.errors.push(`Failed to delete event: ${error}`);
      }
    }

    // Update sync status
    const syncStatus = result.errors.length === 0 ? 'success' : 'partial';
    await prisma.syncStatus.update({
      where: { userId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: syncStatus,
        lastSyncError: result.errors.length > 0 ? result.errors.join('; ') : null,
        totalEventsSynced: result.created + result.updated,
        syncInProgress: false,
      },
    });

    result.success = true;
    return result;
  } catch (error) {
    console.error('Sync error:', error);

    // Update sync status to failed
    await prisma.syncStatus.update({
      where: { userId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'failed',
        lastSyncError: String(error),
        syncInProgress: false,
      },
    });

    result.errors.push(String(error));
    return result;
  }
}

/**
 * Gets current sync status for a user
 */
export async function getSyncStatus(userId: string) {
  const status = await prisma.syncStatus.findUnique({
    where: { userId },
  });

  const isAuthenticated = !!(await getStoredTokens(userId));

  return {
    isAuthenticated,
    syncStatus: status?.lastSyncStatus || 'never_synced',
    lastSyncAt: status?.lastSyncAt,
    lastSyncError: status?.lastSyncError,
    totalEventsSynced: status?.totalEventsSynced || 0,
    syncInProgress: status?.syncInProgress || false,
  };
}

/**
 * Syncs a single custody event (for incremental updates)
 */
export async function syncSingleEvent(
  userId: string,
  custodyEventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const oauth2Client = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const calendarId = await getOrCreateCustodyCalendar(userId);

    // Get custody event
    const custodyEvent = await prisma.custodyEvent.findUnique({
      where: { id: custodyEventId },
    });

    if (!custodyEvent) {
      return { success: false, error: 'Custody event not found' };
    }

    const googleEvent = custodyEventToGoogleEvent(custodyEvent);

    // Check for existing mapping
    const mapping = await prisma.calendarEventMapping.findFirst({
      where: { custodyEventId },
    });

    if (mapping) {
      // Update existing event
      await calendar.events.update({
        calendarId,
        eventId: mapping.googleEventId,
        requestBody: googleEvent,
      });

      await prisma.calendarEventMapping.update({
        where: { id: mapping.id },
        data: {
          lastSyncedAt: new Date(),
          syncStatus: 'synced',
          localLastUpdated: custodyEvent.updatedAt,
        },
      });
    } else {
      // Create new event
      const response = await calendar.events.insert({
        calendarId,
        requestBody: googleEvent,
      });

      if (response.data.id) {
        await prisma.calendarEventMapping.create({
          data: {
            custodyEventId,
            googleEventId: response.data.id,
            calendarId,
            lastSyncedAt: new Date(),
            syncStatus: 'synced',
            localLastUpdated: custodyEvent.updatedAt,
          },
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error syncing single event:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Deletes a custody event from Google Calendar
 */
export async function deleteGoogleEvent(
  userId: string,
  custodyEventId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const oauth2Client = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const mapping = await prisma.calendarEventMapping.findFirst({
      where: { custodyEventId },
    });

    if (mapping) {
      await calendar.events.delete({
        calendarId: mapping.calendarId,
        eventId: mapping.googleEventId,
      });

      await prisma.calendarEventMapping.delete({
        where: { id: mapping.id },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting Google event:', error);
    return { success: false, error: String(error) };
  }
}
