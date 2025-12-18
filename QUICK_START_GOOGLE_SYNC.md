# Quick Start: Google Calendar Sync

Fast setup guide for getting Google Calendar sync running.

## 5-Minute Setup (Development)

### Step 1: Google Cloud Console (2 minutes)

1. Go to https://console.cloud.google.com/
2. Create new project: "Custody Calendar"
3. Enable "Google Calendar API"
4. Create OAuth credentials:
   - Type: Web application
   - Redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID and Secret

### Step 2: Environment Setup (1 minute)

Create `.env` file:

```bash
DATABASE_URL="postgresql://localhost:5432/custody_calendar"
GOOGLE_CLIENT_ID="your-client-id-here.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret-here"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
DEFAULT_USER_ID="default-user"
NODE_ENV="development"
```

### Step 3: Install & Run (2 minutes)

```bash
npm install
npm run prisma:migrate
npm run dev
```

Visit http://localhost:3000

## Test the Integration

1. Click "Connect Google Calendar"
2. Sign in with Google
3. Grant permissions
4. Click "Sync Now"
5. Open Google Calendar - see your custody events!

## Quick Deploy to Vercel

```bash
# Push to GitHub
git init
git add .
git commit -m "Add Google Calendar sync"
git push origin main

# Deploy to Vercel
vercel --prod

# Add environment variables in Vercel dashboard
# Update Google Cloud Console with production URLs
```

## Common Commands

```bash
# Development
npm run dev                  # Start dev server
npm run prisma:migrate       # Run migrations

# Production
npm run build                # Build for production
npm run prisma:deploy        # Deploy migrations
```

## API Quick Reference

```bash
# Connect Google Calendar
GET /api/auth/google

# Trigger sync
curl -X POST http://localhost:3000/api/sync/google

# Check status
curl http://localhost:3000/api/sync/status

# Disconnect
curl -X DELETE http://localhost:3000/api/sync/google
```

## Troubleshooting

**"Redirect URI mismatch"**
- Check URI in Google Console matches `.env` exactly

**"No stored credentials"**
- Re-run OAuth flow to get new tokens

**"Sync failed"**
- Check `GET /api/sync/status` for error details
- Verify Calendar API is enabled

## Full Documentation

- **SETUP.md**: Complete setup guide
- **GOOGLE_CALENDAR_INTEGRATION.md**: Technical details
- **DEPLOYMENT_CHECKLIST.md**: Production deployment

## Support

For detailed help, see SETUP.md or TROUBLESHOOTING section in README.md
