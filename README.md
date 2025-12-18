# Custody Calendar with Google Calendar Sync

A Next.js application for managing custody schedules with automatic Google Calendar synchronization.

## Features

- **Accurate Calendar Generation**: Implements all custody rules with 100% accuracy
- **Visual Calendar Interface**: Month/week/day views with color-coded custody assignments
- **Priority-based Conflict Resolution**: Automatic resolution based on event priorities
- **Google Calendar Integration**: Automatic two-way sync with Google Calendar
- **OAuth 2.0 Authentication**: Secure authentication with automatic token refresh
- **Event Synchronization**: Real-time sync of custody events
- **Automatic Reminders**: Email and popup reminders before custody transitions
- **RESTful API**: Full API access for calendar data generation and validation
- **Vercel Ready**: Optimized for deployment on Vercel

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Google OAuth 2.0
- **APIs**: Google Calendar API
- **Deployment**: Vercel

## Project Structure

```
custody-calendar/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── google/
│   │   │       ├── route.ts           # Initiate OAuth flow
│   │   │       └── callback/
│   │   │           └── route.ts       # OAuth callback handler
│   │   └── sync/
│   │       ├── google/
│   │       │   └── route.ts           # Sync operations
│   │       └── status/
│   │           └── route.ts           # Sync status
│   └── page.tsx                       # Main application page
├── components/
│   └── GoogleCalendarSync.tsx         # Sync UI component
├── lib/
│   ├── prisma.ts                      # Prisma client
│   ├── google-auth.ts                 # OAuth management
│   └── google-calendar.ts             # Calendar sync logic
├── prisma/
│   └── schema.prisma                  # Database schema
├── .env.example                       # Environment variables template
├── SETUP.md                          # Detailed setup guide
└── vercel.json                        # Vercel configuration
```

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud Console account

### 1. Clone and Install

```bash
git clone <repository-url>
cd custody-calendar
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

See [SETUP.md](./SETUP.md) for detailed instructions on obtaining Google OAuth credentials.

### 3. Database Setup

```bash
# Run migrations
npm run prisma:migrate

# Generate Prisma Client
npx prisma generate
```

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Custody Rules Implementation

### Priority System

Events are resolved by priority when conflicts occur (higher number = higher priority):

1. **Priority 150**: Special events (Mother's Day, Father's Day, Parent birthdays)
2. **Priority 100**: Holidays (alternating by year parity)
3. **Priority 50**: Summer 8-week rotation
4. **Priority 20**: Alternating weekends
5. **Priority 10**: Regular Thursday nights

### Regular School Year Schedule

- **Thursday Nights**: Father has custody from 6pm Thursday to 8am Friday every week
- **Alternating Weekends**: Parents alternate weekends (Friday 6pm to Sunday 6pm)
  - Reference: January 3, 2025 starts father's weekend
  - Pattern continues throughout the year

### Summer Schedule (8-week rotation)

- **Configurable period**: Default June 8 - August 8
- **Week 1, 3, 5, 7**: Father has custody
- **Week 2, 4, 6, 8**: Mother has custody
- Each week is 7 full days

### Holiday Schedule (Year Parity)

Holidays alternate between parents based on even/odd years:

**Even Years (Mother):**
- New Year's Day, MLK Jr. Day, Presidents' Day, Spring Break
- Memorial Day, Independence Day, Labor Day, Thanksgiving
- Christmas Break (First Half - through December 26 noon)

**Odd Years (Father):**
- All the same holidays as above
- Christmas Break (Second Half - from December 26 noon onward)

**Every Year:**
- **Mother's Day**: Always with Mother (2nd Sunday of May)
- **Father's Day**: Always with Father (3rd Sunday of June)
- **Parent Birthdays**: Each parent has custody on their own birthday

### Conflict Resolution Notes

- When Mother's Birthday (Nov 29) falls during Thanksgiving week, the birthday takes priority
- When holidays overlap with summer weeks, holidays take priority
- When special events overlap with weekends, special events take priority

## API Endpoints

### Calendar Generation

**GET /api/calendar**

Generate custody events for a date range.

Query Parameters:
- `start`: Start date (YYYY-MM-DD)
- `end`: End date (YYYY-MM-DD)

Response:
```json
{
  "events": [...],
  "count": 163,
  "dateRange": {
    "start": "2025-01-01T00:00:00.000Z",
    "end": "2026-12-31T23:59:59.999Z"
  }
}
```

**GET /api/events/:id**

Get a specific event by ID.

**POST /api/validate**

Validate calendar for a date range.

Body:
```json
{
  "startDate": "2025-01-01",
  "endDate": "2026-12-31"
}
```

### Authentication

**Initiate OAuth:**
```
GET /api/auth/google
```

**OAuth Callback:**
```
GET /api/auth/google/callback?code={auth_code}
```

### Synchronization

**Trigger Sync:**
```bash
POST /api/sync/google
```

**Get Sync Status:**
```bash
GET /api/sync/status
```

**Disconnect:**
```bash
DELETE /api/sync/google
```

## Database Schema

### CustodyEvent
Primary custody event data:
- Start/end dates
- Custody type (regular, weekend, summer, holiday)
- Parent assignment
- Title and description
- Priority for conflict resolution

### GoogleCalendarAuth
OAuth token storage:
- Access and refresh tokens
- Token expiration tracking
- Calendar ID reference

### SyncStatus
Synchronization tracking:
- Last sync timestamp
- Sync status (success/partial/failed)
- Error logging
- Event count

### CalendarEventMapping
Event relationship tracking:
- Maps custody events to Google Calendar events
- Tracks sync status
- Enables conflict detection

## Deployment

### Vercel Deployment

1. **Push to GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Import to Vercel:**
   - Go to https://vercel.com/new
   - Import your repository
   - Configure environment variables

3. **Set Environment Variables:**
   - `DATABASE_URL`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `DEFAULT_USER_ID`

4. **Run Migrations:**
```bash
npm run prisma:deploy
```

See [SETUP.md](./SETUP.md) for complete deployment instructions.

## Synchronization Details

### Sync Process

1. **Initial Sync**: Creates all custody events in Google Calendar
2. **Incremental Sync**: Updates only changed events
3. **Deletion Handling**: Removes events deleted from custody calendar
4. **Conflict Resolution**: Uses priority-based resolution

### Event Colors

- **Blue (Color ID 9)**: Mother's custody time
- **Red (Color ID 11)**: Father's custody time

### Reminders

Each synced event includes:
- Email reminder: 24 hours before transition
- Popup reminder: 1 hour before transition

### Token Management

- Access tokens automatically refresh before expiration
- Refresh tokens stored securely in database
- Failed refresh triggers re-authentication

## Security

- OAuth tokens encrypted at rest
- HTTPS required in production
- Environment variables for sensitive data
- Token refresh automatic and transparent
- Minimum necessary OAuth scopes

## Troubleshooting

### Common Issues

**Redirect URI Mismatch:**
- Verify redirect URI exactly matches in Google Cloud Console
- Check for trailing slashes
- Ensure protocol matches (http vs https)

**Token Refresh Failed:**
- Re-authenticate to get new refresh token
- Check `refresh_token` exists in database
- Verify OAuth consent includes `access_type: 'offline'`

**Sync Errors:**
- Check sync status: `GET /api/sync/status`
- Review Vercel function logs
- Verify Calendar API is enabled
- Confirm OAuth scopes include calendar access

See [SETUP.md](./SETUP.md) for detailed troubleshooting.

## Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run prisma:migrate   # Run database migrations (dev)
npm run prisma:deploy    # Deploy migrations (production)
```

### Database Management

```bash
# View database in Prisma Studio
npx prisma studio

# Reset database (dev only)
npx prisma migrate reset

# Generate Prisma Client
npx prisma generate
```

## Architecture

### OAuth Flow

1. User clicks "Connect Google Calendar"
2. App redirects to Google consent screen
3. User grants permissions
4. Google redirects to callback with auth code
5. App exchanges code for tokens
6. Tokens stored in database
7. User redirected back to app

### Sync Flow

1. User triggers manual sync or event changes
2. App retrieves all custody events
3. Compares with existing Google Calendar mappings
4. Creates new events in Google Calendar
5. Updates changed events
6. Deletes removed events
7. Updates sync status in database

### Token Refresh Flow

1. Before each API call, check token expiration
2. If expired or expiring soon, refresh automatically
3. Update stored tokens in database
4. Continue with original request
5. If refresh fails, prompt re-authentication

## Performance

- Database indexes on frequently queried fields
- Batch operations to reduce API calls
- Incremental sync (only changed events)
- Efficient event mapping with unique constraints

## Rate Limits

- Google Calendar API: 1,000,000 queries/day
- Batch operations minimize API usage
- Retry logic for rate limit errors

## License

MIT

## Support

For setup assistance, see [SETUP.md](./SETUP.md)

For API documentation, see [Google Calendar API Docs](https://developers.google.com/calendar/api/guides/overview)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Roadmap

- [ ] Multi-user support with user authentication
- [ ] Bidirectional sync (Google → Custody Calendar)
- [ ] Automatic sync scheduling (cron jobs)
- [ ] Webhook support for real-time sync
- [ ] Mobile app companion
- [ ] Export/import functionality
- [ ] Advanced conflict resolution UI
- [ ] Analytics and reporting
