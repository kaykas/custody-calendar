# Google Calendar Integration - Technical Documentation

## Overview

This document provides technical details about the Google Calendar OAuth integration and synchronization system for the Custody Calendar application.

## Architecture

### System Components

```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
         ├─── API Routes ────┐
         │                   │
         ├─ OAuth Flow       │
         │  ├─ /api/auth/google
         │  └─ /api/auth/google/callback
         │                   │
         ├─ Sync Operations  │
         │  ├─ /api/sync/google (POST/DELETE)
         │  └─ /api/sync/status (GET)
         │                   │
         └─────────┬─────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    ┌────▼────┐      ┌──────▼──────┐
    │ Google  │      │ PostgreSQL  │
    │Calendar │      │  Database   │
    │   API   │      │             │
    └─────────┘      └─────────────┘
```

## Database Schema

### GoogleCalendarAuth Table

Stores OAuth credentials for Google Calendar access.

```typescript
model GoogleCalendarAuth {
  id           String   @id @default(cuid())
  userId       String   @unique
  accessToken  String   // Current access token
  refreshToken String   // Refresh token for renewal
  tokenType    String   @default("Bearer")
  expiresAt    DateTime // Token expiration timestamp
  scope        String   // Granted OAuth scopes
  calendarId   String?  // ID of custody calendar
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@index([userId])
  @@index([expiresAt])
}
```

**Key Fields:**
- `accessToken`: Short-lived token for API requests (1 hour)
- `refreshToken`: Long-lived token for getting new access tokens
- `expiresAt`: Tracks when access token expires (for automatic refresh)
- `calendarId`: Reference to dedicated custody calendar in Google

### SyncStatus Table

Tracks synchronization state and history.

```typescript
model SyncStatus {
  id                String   @id @default(cuid())
  userId            String   @unique
  lastSyncAt        DateTime?
  lastSyncStatus    String   @default("never_synced")
  lastSyncError     String?
  totalEventsSynced Int      @default(0)
  syncInProgress    Boolean  @default(false)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([userId])
  @@index([lastSyncAt])
}
```

**Status Values:**
- `never_synced`: Initial state, no sync performed
- `success`: Last sync completed without errors
- `partial`: Some events synced, some failed
- `failed`: Sync attempt failed completely

### CalendarEventMapping Table

Maps local custody events to Google Calendar events.

```typescript
model CalendarEventMapping {
  id               String   @id @default(cuid())
  custodyEventId   String   // Local event ID
  googleEventId    String   // Google Calendar event ID
  calendarId       String   // Google Calendar ID
  lastSyncedAt     DateTime
  syncStatus       String   @default("synced")
  localLastUpdated DateTime // For change detection
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@unique([custodyEventId, googleEventId])
  @@index([custodyEventId])
  @@index([googleEventId])
  @@index([syncStatus])
}
```

**Sync Status Values:**
- `synced`: Event in sync
- `needs_update`: Local changes detected
- `conflict`: Conflicting changes detected
- `deleted`: Event deleted locally

## OAuth 2.0 Implementation

### Authorization Flow

1. **User Initiates Connection**
   - User clicks "Connect Google Calendar"
   - App redirects to `GET /api/auth/google`

2. **Generate Authorization URL**
   ```typescript
   const authUrl = oauth2Client.generateAuthUrl({
     access_type: 'offline',  // Get refresh token
     scope: SCOPES,
     prompt: 'consent',       // Force consent for refresh token
   });
   ```

3. **User Grants Permissions**
   - Google shows consent screen
   - User approves requested scopes
   - Google redirects to callback URL with `code`

4. **Exchange Code for Tokens**
   ```typescript
   const { tokens } = await oauth2Client.getToken(code);
   // tokens contains: access_token, refresh_token, expiry_date
   ```

5. **Store Tokens**
   - Save to `GoogleCalendarAuth` table
   - Calculate expiration time
   - Store calendar ID if available

### Token Refresh Mechanism

**Automatic Refresh Before Expiration:**

```typescript
// Check if token expires within 5 minutes
const now = Date.now();
const expiryTime = storedAuth.expiresAt.getTime();
const fiveMinutes = 5 * 60 * 1000;

if (expiryTime - now < fiveMinutes) {
  // Refresh token
  const { credentials } = await oauth2Client.refreshAccessToken();

  // Update database
  await storeTokens(userId, credentials);
}
```

**Benefits:**
- Prevents API failures from expired tokens
- Seamless user experience
- No manual re-authentication needed

**Error Handling:**
- If refresh fails, prompt user to re-authenticate
- Log error for debugging
- Clear invalid tokens from database

## Synchronization System

### Sync Algorithm

**High-Level Flow:**

```
1. Fetch all local custody events
2. Fetch existing event mappings
3. For each custody event:
   a. Check if mapping exists
   b. If no mapping → CREATE in Google Calendar
   c. If mapping exists:
      - Compare updatedAt timestamps
      - If local newer → UPDATE in Google Calendar
      - Otherwise → SKIP (already synced)
4. For unmapped Google events:
   → DELETE from Google Calendar
5. Update sync status
```

**Detailed Implementation:**

```typescript
export async function syncAllEvents(userId: string): Promise<SyncResult> {
  // 1. Mark sync in progress
  await prisma.syncStatus.update({
    where: { userId },
    data: { syncInProgress: true }
  });

  // 2. Get authenticated client
  const oauth2Client = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  // 3. Get or create dedicated calendar
  const calendarId = await getOrCreateCustodyCalendar(userId);

  // 4. Fetch all custody events
  const custodyEvents = await prisma.custodyEvent.findMany();

  // 5. Fetch existing mappings
  const existingMappings = await prisma.calendarEventMapping.findMany();
  const mappingMap = new Map(
    existingMappings.map(m => [m.custodyEventId, m])
  );

  // 6. Sync each event
  for (const event of custodyEvents) {
    const mapping = mappingMap.get(event.id);

    if (!mapping) {
      // CREATE new event
      const response = await calendar.events.insert({
        calendarId,
        requestBody: custodyEventToGoogleEvent(event)
      });

      // Store mapping
      await prisma.calendarEventMapping.create({
        data: {
          custodyEventId: event.id,
          googleEventId: response.data.id,
          calendarId,
          lastSyncedAt: new Date(),
          syncStatus: 'synced',
          localLastUpdated: event.updatedAt
        }
      });
    } else if (event.updatedAt > mapping.localLastUpdated) {
      // UPDATE existing event
      await calendar.events.update({
        calendarId,
        eventId: mapping.googleEventId,
        requestBody: custodyEventToGoogleEvent(event)
      });

      // Update mapping
      await prisma.calendarEventMapping.update({
        where: { id: mapping.id },
        data: {
          lastSyncedAt: new Date(),
          localLastUpdated: event.updatedAt
        }
      });
    }

    // Remove from map (for deletion detection)
    mappingMap.delete(event.id);
  }

  // 7. Delete orphaned events
  for (const [custodyEventId, mapping] of mappingMap) {
    await calendar.events.delete({
      calendarId: mapping.calendarId,
      eventId: mapping.googleEventId
    });

    await prisma.calendarEventMapping.delete({
      where: { id: mapping.id }
    });
  }

  // 8. Update sync status
  await prisma.syncStatus.update({
    where: { userId },
    data: {
      lastSyncAt: new Date(),
      lastSyncStatus: 'success',
      syncInProgress: false
    }
  });
}
```

### Event Conversion

**Custody Event → Google Calendar Event:**

```typescript
function custodyEventToGoogleEvent(event: CustodyEvent): calendar_v3.Schema$Event {
  return {
    summary: event.title,
    description: event.description || `Custody: ${event.custodyType}`,

    start: {
      dateTime: event.startDate.toISOString(),
      timeZone: 'America/Los_Angeles'
    },

    end: {
      dateTime: event.endDate.toISOString(),
      timeZone: 'America/Los_Angeles'
    },

    // Color coding
    colorId: event.parent === 'mother' ? '9' : '11',

    // Reminders
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },  // 1 day
        { method: 'popup', minutes: 60 }         // 1 hour
      ]
    },

    // Metadata for tracking
    extendedProperties: {
      private: {
        custodyEventId: event.id,
        custodyType: event.custodyType,
        parent: event.parent,
        priority: event.priority.toString()
      }
    }
  };
}
```

**Event Colors:**
- Color ID 9 (Blue): Mother's custody
- Color ID 11 (Red): Father's custody

### Conflict Detection

**Change Detection:**

1. **Timestamp Comparison**
   ```typescript
   if (event.updatedAt > mapping.localLastUpdated) {
     // Local event changed since last sync
     // Trigger update in Google Calendar
   }
   ```

2. **Sync Status Tracking**
   - `synced`: No conflicts
   - `needs_update`: Local changes pending
   - `conflict`: Both local and remote changes

**Resolution Strategy:**

- **Local changes take precedence** (one-way sync)
- Future: Implement bidirectional sync with user resolution UI

### Incremental Sync

**Optimization:** Only sync changed events

```typescript
// Check if update needed
if (event.updatedAt > mapping.localLastUpdated) {
  // Update only if changed
  await updateGoogleEvent(event, mapping);
} else {
  // Skip, already in sync
  continue;
}
```

**Benefits:**
- Reduced API calls
- Faster sync operations
- Lower rate limit usage

## API Routes

### GET /api/auth/google

**Purpose:** Initiate OAuth flow

**Implementation:**
```typescript
export async function GET() {
  const authUrl = getAuthorizationUrl();
  return NextResponse.redirect(authUrl);
}
```

**Response:** Redirect to Google consent screen

### GET /api/auth/google/callback

**Purpose:** Handle OAuth callback

**Parameters:**
- `code`: Authorization code from Google
- `error`: Error message if authorization failed

**Implementation:**
```typescript
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const userId = process.env.DEFAULT_USER_ID || 'default-user';

  await handleOAuthCallback(code, userId);

  return NextResponse.redirect('/?auth=success');
}
```

**Response:** Redirect to app with status

### POST /api/sync/google

**Purpose:** Trigger manual synchronization

**Authentication:** Checks if user authenticated

**Implementation:**
```typescript
export async function POST(request: NextRequest) {
  const userId = process.env.DEFAULT_USER_ID || 'default-user';

  const authenticated = await isAuthenticated(userId);
  if (!authenticated) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const result = await syncAllEvents(userId);

  return NextResponse.json({
    success: true,
    details: {
      totalEvents: result.totalEvents,
      created: result.created,
      updated: result.updated,
      deleted: result.deleted,
      errors: result.errors
    }
  });
}
```

**Response:**
```json
{
  "success": true,
  "message": "Synchronization completed",
  "details": {
    "totalEvents": 25,
    "created": 5,
    "updated": 3,
    "deleted": 1,
    "errors": []
  }
}
```

### GET /api/sync/status

**Purpose:** Get current sync status

**Implementation:**
```typescript
export async function GET() {
  const userId = process.env.DEFAULT_USER_ID || 'default-user';
  const status = await getSyncStatus(userId);

  return NextResponse.json({ success: true, status });
}
```

**Response:**
```json
{
  "success": true,
  "status": {
    "isAuthenticated": true,
    "syncStatus": "success",
    "lastSyncAt": "2025-12-18T10:30:00Z",
    "lastSyncError": null,
    "totalEventsSynced": 25,
    "syncInProgress": false
  }
}
```

### DELETE /api/sync/google

**Purpose:** Disconnect Google Calendar integration

**Implementation:**
```typescript
export async function DELETE() {
  const userId = process.env.DEFAULT_USER_ID || 'default-user';

  await revokeAccess(userId);

  return NextResponse.json({
    success: true,
    message: 'Google Calendar disconnected'
  });
}
```

**Actions Performed:**
1. Revoke tokens with Google
2. Delete from `GoogleCalendarAuth` table
3. Delete from `SyncStatus` table
4. Delete all event mappings

## Error Handling

### OAuth Errors

**Common Issues:**

1. **Redirect URI Mismatch**
   ```
   Error: redirect_uri_mismatch
   ```
   **Solution:** Verify URI in Google Console matches exactly

2. **Invalid Grant**
   ```
   Error: invalid_grant
   ```
   **Solution:** Re-authenticate, refresh token may be expired

3. **Insufficient Permissions**
   ```
   Error: insufficient_permissions
   ```
   **Solution:** Check OAuth scopes include calendar access

### Sync Errors

**Error Types:**

1. **API Rate Limit**
   ```typescript
   if (error.code === 429) {
     // Retry with exponential backoff
   }
   ```

2. **Network Timeout**
   ```typescript
   if (error.code === 'ETIMEDOUT') {
     // Retry request
   }
   ```

3. **Invalid Event Data**
   ```typescript
   try {
     await calendar.events.insert({ ... });
   } catch (error) {
     // Log error, continue with next event
     result.errors.push(`Failed to sync event: ${error.message}`);
   }
   ```

**Error Logging:**

All errors logged to:
- Database `SyncStatus.lastSyncError`
- Vercel function logs
- Console (development)

## Security Considerations

### Token Security

**Storage:**
- Tokens stored in PostgreSQL
- Database uses encryption at rest
- No tokens in client-side code

**Transmission:**
- HTTPS enforced in production (Vercel)
- Tokens never sent to client
- API routes server-side only

**Access Control:**
- Single-user deployment (configurable)
- Future: Multi-user with authentication

### OAuth Scopes

**Principle of Least Privilege:**

Only request necessary scopes:
```typescript
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];
```

**Why these scopes:**
- Read/write calendar events
- Create dedicated custody calendar
- Update/delete events as needed

### Environment Variables

**Never commit:**
- `.env` files in `.gitignore`
- Use Vercel environment variables
- Rotate secrets periodically

## Performance Optimization

### Database Indexes

```typescript
@@index([userId])      // Fast user lookups
@@index([expiresAt])   // Efficient token expiration checks
@@index([custodyEventId])  // Quick event mapping lookups
@@index([syncStatus])  // Filter by sync status
```

### API Call Optimization

**Batching:**
- Future: Use batch API for multiple events
- Current: Sequential to ensure accuracy

**Caching:**
- Cache calendar ID after creation
- Reuse authenticated client per request

**Rate Limit Management:**
- Google Calendar: 1M queries/day
- Current usage: ~3 API calls per event
- For 1000 events: ~3000 calls << rate limit

### Database Query Optimization

**Efficient Queries:**
```typescript
// Fetch all mappings once
const mappings = await prisma.calendarEventMapping.findMany();

// Use Map for O(1) lookups
const mappingMap = new Map(mappings.map(m => [m.custodyEventId, m]));
```

## Testing

### Manual Testing

1. **OAuth Flow**
   - Click "Connect Google Calendar"
   - Verify redirect to Google
   - Grant permissions
   - Verify redirect back with success

2. **Event Sync**
   - Create custody event
   - Trigger sync
   - Check Google Calendar for event
   - Verify color and reminders

3. **Update Sync**
   - Modify custody event
   - Trigger sync
   - Verify Google Calendar updated

4. **Delete Sync**
   - Delete custody event
   - Trigger sync
   - Verify removed from Google Calendar

### Automated Testing

**Future Implementation:**

```typescript
describe('Google Calendar Sync', () => {
  it('should create events in Google Calendar', async () => {
    const result = await syncAllEvents(userId);
    expect(result.success).toBe(true);
    expect(result.created).toBeGreaterThan(0);
  });

  it('should handle token refresh', async () => {
    // Mock expired token
    const client = await getAuthenticatedClient(userId);
    expect(client).toBeDefined();
  });
});
```

## Monitoring

### Key Metrics

1. **Sync Success Rate**
   - Track via `SyncStatus.lastSyncStatus`
   - Alert on repeated failures

2. **Token Refresh Rate**
   - Monitor refresh attempts
   - Alert on refresh failures

3. **API Error Rate**
   - Track Google API errors
   - Monitor rate limit usage

4. **Sync Duration**
   - Track sync operation time
   - Alert on slow syncs

### Logging

**What to Log:**
- OAuth callback success/failure
- Sync start/completion
- Token refresh events
- API errors
- Event creation/update/deletion

**Where:**
- Vercel function logs
- Database `SyncStatus` table
- Console (development)

## Future Enhancements

### Bidirectional Sync

**Challenge:** Detecting remote changes

**Solution:**
1. Store `etag` from Google Calendar responses
2. On sync, fetch events with `syncToken`
3. Compare local and remote changes
4. UI for conflict resolution

### Webhook Support

**Real-time sync using Google Calendar Push Notifications:**

1. Register webhook endpoint
2. Receive notifications on calendar changes
3. Trigger incremental sync
4. Reduce polling frequency

### Multi-User Support

**Requirements:**
1. User authentication system
2. Per-user token storage
3. User-specific calendar permissions
4. Isolated event mappings

### Automatic Sync Scheduling

**Cron-based sync:**

```typescript
// Vercel cron job
export async function GET(request: Request) {
  const users = await prisma.googleCalendarAuth.findMany();

  for (const user of users) {
    await syncAllEvents(user.userId);
  }

  return Response.json({ success: true });
}
```

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/sync",
    "schedule": "0 */6 * * *"  // Every 6 hours
  }]
}
```

## References

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Calendar Event Colors](https://developers.google.com/calendar/api/guides/colors)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

## Conclusion

The Google Calendar integration provides robust, secure synchronization of custody events with automatic token management and comprehensive error handling. The system is production-ready for single-user deployment and extensible for multi-user scenarios.
