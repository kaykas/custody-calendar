# Custody Calendar - Google Calendar Integration Setup

This guide walks you through setting up Google Calendar OAuth integration and deploying to Vercel.

## Prerequisites

- Google Account
- Vercel Account
- PostgreSQL Database (can use Vercel Postgres, Supabase, or any PostgreSQL provider)
- Node.js 18+ installed locally

## Part 1: Google Cloud Console Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a Project" dropdown at the top
3. Click "New Project"
4. Enter project name: "Custody Calendar" (or your preferred name)
5. Click "Create"
6. Wait for project creation, then select your new project

### Step 2: Enable Google Calendar API

1. In the Google Cloud Console, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"
4. Wait for API to be enabled

### Step 3: Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" user type (unless you have Google Workspace)
3. Click "Create"

**Configure OAuth Consent Screen:**

- **App name:** Custody Calendar
- **User support email:** Your email address
- **App logo:** Optional
- **Application home page:** Your Vercel URL (or localhost for testing)
- **Authorized domains:**
  - For production: `your-app.vercel.app`
  - For local testing: leave empty or add `localhost`
- **Developer contact information:** Your email address

4. Click "Save and Continue"

**Scopes:**

5. Click "Add or Remove Scopes"
6. Filter for "Google Calendar API"
7. Select these scopes:
   - `.../auth/calendar` (See, edit, share, and permanently delete all calendars)
   - `.../auth/calendar.events` (View and edit events on all calendars)
8. Click "Update" then "Save and Continue"

**Test Users (only needed for testing before publishing):**

9. Click "Add Users"
10. Add your email address and any other test users
11. Click "Save and Continue"
12. Review and click "Back to Dashboard"

### Step 4: Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Application type: **Web application**
4. Name: "Custody Calendar Web Client"

**Authorized JavaScript origins:**

- For local development: `http://localhost:3000`
- For production: `https://your-app.vercel.app`

**Authorized redirect URIs:**

- For local development: `http://localhost:3000/api/auth/google/callback`
- For production: `https://your-app.vercel.app/api/auth/google/callback`

5. Click "Create"
6. **IMPORTANT:** Copy the Client ID and Client Secret - you'll need these for environment variables

### Step 5: Publish OAuth App (Optional)

If you want to remove the "unverified app" warning:

1. Go back to "OAuth consent screen"
2. Click "Publish App"
3. Note: For personal use, you can skip this step and just use test users

## Part 2: Database Setup

### Option A: Vercel Postgres (Recommended)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project (or create one)
3. Go to "Storage" tab
4. Click "Create Database" > "Postgres"
5. Follow prompts to create database
6. Copy the `DATABASE_URL` connection string

### Option B: Other PostgreSQL Providers

Use any PostgreSQL provider (Supabase, Railway, etc.) and get the connection string in this format:

```
postgresql://username:password@host:port/database
```

## Part 3: Local Development Setup

### Step 1: Clone and Install

```bash
cd custody-calendar
npm install
```

### Step 2: Create Environment File

Create `.env` file in the project root:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/custody_calendar"

# Google OAuth 2.0
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-command-below"

# Node Environment
NODE_ENV="development"

# User ID (for single-user deployment)
DEFAULT_USER_ID="default-user"
```

### Step 3: Generate NextAuth Secret

```bash
openssl rand -base64 32
```

Copy the output and paste it as `NEXTAUTH_SECRET` in your `.env` file.

### Step 4: Run Database Migrations

```bash
npm run prisma:migrate
```

This will:
- Create all necessary tables in your database
- Generate Prisma Client for type-safe database access

### Step 5: Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your application.

## Part 4: Vercel Deployment

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Custody calendar with Google sync"
git branch -M main
git remote add origin https://github.com/your-username/custody-calendar.git
git push -u origin main
```

### Step 2: Import to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Import your GitHub repository
3. Vercel will auto-detect Next.js

### Step 3: Configure Environment Variables

In Vercel project settings, go to "Environment Variables" and add:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | Your production database URL | Production |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console | Production |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console | Production |
| `GOOGLE_REDIRECT_URI` | `https://your-app.vercel.app/api/auth/google/callback` | Production |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production |
| `NEXTAUTH_SECRET` | Same as local or generate new | Production |
| `DEFAULT_USER_ID` | `default-user` | Production |

### Step 4: Update Google Cloud Console

1. Go back to Google Cloud Console > Credentials
2. Edit your OAuth client
3. Add production redirect URI: `https://your-app.vercel.app/api/auth/google/callback`
4. Add production JavaScript origin: `https://your-app.vercel.app`
5. Save changes

### Step 5: Run Database Migrations in Production

```bash
# Set DATABASE_URL to production database
export DATABASE_URL="your-production-database-url"

# Run migrations
npm run prisma:deploy
```

Or use Vercel CLI:

```bash
vercel env pull .env.production
npm run prisma:deploy
```

### Step 6: Deploy

```bash
# Using Vercel CLI
vercel --prod

# Or push to GitHub (auto-deploys)
git push origin main
```

## Part 5: Using the Application

### First Time Setup

1. Visit your deployed application
2. Click "Connect Google Calendar" button
3. Sign in with Google
4. Grant permissions for Calendar access
5. You'll be redirected back to the app

### Synchronization

**Automatic Sync:**
- Events are automatically synced when created/updated in the custody calendar
- Sync happens in real-time via API calls

**Manual Sync:**
- Click "Sync Now" button in the UI
- Or call `POST /api/sync/google` directly

**Check Sync Status:**
- View sync status in the UI
- Or call `GET /api/sync/status`

### Event Colors

Events are color-coded in Google Calendar:
- **Blue (Color ID 9):** Mother's custody time
- **Red (Color ID 11):** Father's custody time

### Reminders

Each synced event includes:
- Email reminder: 24 hours before
- Popup reminder: 1 hour before

## Part 6: API Endpoints

### Authentication

**Initiate OAuth Flow:**
```
GET /api/auth/google
```
Redirects to Google consent screen.

**OAuth Callback:**
```
GET /api/auth/google/callback?code=...
```
Handles OAuth response and stores tokens.

### Synchronization

**Trigger Manual Sync:**
```bash
curl -X POST https://your-app.vercel.app/api/sync/google
```

**Check Sync Status:**
```bash
curl https://your-app.vercel.app/api/sync/status
```

**Disconnect Google Calendar:**
```bash
curl -X DELETE https://your-app.vercel.app/api/sync/google
```

## Part 7: Database Schema

The integration adds these tables:

### GoogleCalendarAuth
Stores OAuth tokens:
- `accessToken`: Current access token
- `refreshToken`: Refresh token for getting new access tokens
- `expiresAt`: Token expiration time
- `calendarId`: Google Calendar ID where events are synced

### SyncStatus
Tracks synchronization status:
- `lastSyncAt`: When last sync occurred
- `lastSyncStatus`: "success", "partial", "failed", or "never_synced"
- `totalEventsSynced`: Count of synced events
- `syncInProgress`: Boolean flag for ongoing sync

### CalendarEventMapping
Maps custody events to Google Calendar events:
- `custodyEventId`: Local event ID
- `googleEventId`: Google Calendar event ID
- `syncStatus`: Current sync state
- `localLastUpdated`: Last update time for conflict detection

## Part 8: Troubleshooting

### "Redirect URI mismatch" Error

**Problem:** OAuth callback fails with redirect URI error.

**Solution:**
1. Verify the redirect URI in Google Cloud Console exactly matches what's in your `.env`
2. Include both `http://localhost:3000/api/auth/google/callback` (dev) and `https://your-app.vercel.app/api/auth/google/callback` (prod)
3. No trailing slashes
4. Match protocol (http vs https)

### Token Refresh Failures

**Problem:** "Failed to refresh access token" error.

**Solution:**
1. Ensure `refresh_token` is being saved (use `access_type: 'offline'` and `prompt: 'consent'`)
2. Check database `GoogleCalendarAuth` table has non-null `refreshToken`
3. Re-authenticate if refresh token is invalid

### Database Connection Issues

**Problem:** "Can't reach database server" error.

**Solution:**
1. Verify `DATABASE_URL` is correct
2. Check database is accessible from Vercel (IP whitelist if needed)
3. Ensure database accepts SSL connections
4. Test connection locally first

### Sync Not Working

**Problem:** Events don't appear in Google Calendar.

**Solution:**
1. Check sync status: `GET /api/sync/status`
2. View sync errors in database `SyncStatus.lastSyncError`
3. Verify Calendar API is enabled in Google Cloud Console
4. Check OAuth scopes include calendar access
5. Look at Vercel function logs for errors

### "Unverified App" Warning

**Problem:** Google shows warning about unverified app.

**Solution:**
1. For personal use: Click "Advanced" > "Go to [App Name] (unsafe)"
2. For production: Submit app for verification (or publish for internal use)
3. Add test users in OAuth consent screen

## Part 9: Security Considerations

### Token Storage

- Tokens are encrypted at rest in PostgreSQL
- Never log or expose tokens in client-side code
- Use HTTPS in production (enforced by Vercel)

### Environment Variables

- Never commit `.env` to version control
- Use Vercel's environment variable encryption
- Rotate `NEXTAUTH_SECRET` periodically

### OAuth Scopes

- Request minimum necessary scopes
- Current scopes: calendar and calendar.events
- Users can revoke access at: https://myaccount.google.com/permissions

### Rate Limits

- Google Calendar API: 1,000,000 queries/day
- Batch operations to reduce API calls
- Implement retry logic for rate limit errors

## Part 10: Maintenance

### Monitoring

Check these regularly:
- Sync status via `/api/sync/status`
- Vercel function logs for errors
- Database for failed sync records

### Token Expiration

- Access tokens expire after 1 hour
- Refresh tokens handled automatically
- Re-authentication required if refresh token expires

### Database Backups

- Enable automated backups in your database provider
- Test restore process periodically
- Keep backups for at least 30 days

## Support

For issues:
1. Check Vercel function logs
2. Review database `SyncStatus` table for errors
3. Verify Google Cloud Console configuration
4. Test API endpoints with curl/Postman

## References

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Vercel Deployment Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes Documentation](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
