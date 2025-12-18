# Deployment Checklist

Use this checklist to ensure a smooth deployment of the Custody Calendar application.

## Pre-Deployment

### Google Cloud Console Setup

- [ ] Create Google Cloud Project
- [ ] Enable Google Calendar API
- [ ] Configure OAuth consent screen
  - [ ] Set app name and support email
  - [ ] Add authorized domains
  - [ ] Add developer contact
- [ ] Add OAuth scopes
  - [ ] `https://www.googleapis.com/auth/calendar`
  - [ ] `https://www.googleapis.com/auth/calendar.events`
- [ ] Create OAuth 2.0 credentials
  - [ ] Add JavaScript origins
  - [ ] Add redirect URIs (both dev and prod)
- [ ] Save Client ID and Client Secret securely

### Database Setup

- [ ] Choose database provider (Vercel Postgres, Supabase, etc.)
- [ ] Create production database
- [ ] Save connection string securely
- [ ] Verify database accepts SSL connections
- [ ] Configure IP whitelist if needed

### Environment Variables

Create `.env` file with all required variables:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `GOOGLE_CLIENT_ID` - From Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- [ ] `GOOGLE_REDIRECT_URI` - Production callback URL
- [ ] `NEXTAUTH_URL` - Production app URL
- [ ] `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
- [ ] `DEFAULT_USER_ID` - Default user identifier
- [ ] `NODE_ENV` - Set to "production"

### Code Repository

- [ ] Initialize git repository
- [ ] Create `.gitignore` (ensure `.env` is excluded)
- [ ] Commit all code
- [ ] Push to GitHub/GitLab/Bitbucket

## Vercel Deployment

### Initial Setup

- [ ] Create Vercel account
- [ ] Import repository from GitHub
- [ ] Verify Next.js framework detected
- [ ] Configure build settings (if needed)

### Environment Variables Configuration

In Vercel project settings > Environment Variables:

- [ ] Add `DATABASE_URL`
- [ ] Add `GOOGLE_CLIENT_ID`
- [ ] Add `GOOGLE_CLIENT_SECRET`
- [ ] Add `GOOGLE_REDIRECT_URI` (use production URL)
- [ ] Add `NEXTAUTH_URL` (use production URL)
- [ ] Add `NEXTAUTH_SECRET`
- [ ] Add `DEFAULT_USER_ID`
- [ ] Set environment scope (Production, Preview, Development)

### Database Migration

- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Pull environment variables: `vercel env pull .env.production`
- [ ] Run migrations: `npm run prisma:deploy`
- [ ] Verify tables created in database

### Domain Configuration

- [ ] Configure custom domain (optional)
- [ ] Verify SSL certificate active
- [ ] Update DNS records if using custom domain

## Post-Deployment

### Google Cloud Console Updates

- [ ] Update OAuth consent screen with production URL
- [ ] Add production redirect URI: `https://your-app.vercel.app/api/auth/google/callback`
- [ ] Add production JavaScript origin: `https://your-app.vercel.app`
- [ ] Save and verify changes

### Application Testing

- [ ] Visit production URL
- [ ] Test "Connect Google Calendar" button
- [ ] Complete OAuth flow
- [ ] Verify redirected back to app
- [ ] Check authentication status
- [ ] Create test custody event (if not already done by Agent 1)
- [ ] Trigger manual sync
- [ ] Verify events appear in Google Calendar
- [ ] Check event colors (blue for mother, red for father)
- [ ] Verify reminders set correctly
- [ ] Test disconnect functionality

### Database Verification

- [ ] Check `GoogleCalendarAuth` table has token entry
- [ ] Verify `SyncStatus` shows successful sync
- [ ] Confirm `CalendarEventMapping` has event mappings
- [ ] Validate `CustodyEvent` table populated

### Security Checks

- [ ] Verify `.env` not committed to repository
- [ ] Confirm HTTPS enabled (automatic on Vercel)
- [ ] Check OAuth tokens encrypted at rest
- [ ] Validate redirect URI whitelist
- [ ] Test token refresh mechanism

### Performance Verification

- [ ] Check Vercel function logs for errors
- [ ] Verify API response times acceptable
- [ ] Monitor database connection pool
- [ ] Test sync with multiple events
- [ ] Verify incremental sync working

## Monitoring Setup

### Vercel Monitoring

- [ ] Enable Vercel Analytics
- [ ] Set up error notifications
- [ ] Configure function timeout alerts
- [ ] Monitor database query performance

### Application Monitoring

- [ ] Check sync status regularly via UI
- [ ] Monitor sync error logs
- [ ] Verify token refresh working
- [ ] Track API rate limits

### Database Monitoring

- [ ] Enable database backups
- [ ] Set up automated backup schedule
- [ ] Monitor connection count
- [ ] Track storage usage

## Troubleshooting Preparation

### Documentation

- [ ] Save all environment variables securely
- [ ] Document custom configuration
- [ ] Note any provider-specific settings
- [ ] Record database connection details

### Access Setup

- [ ] Ensure access to Google Cloud Console
- [ ] Verify access to database admin panel
- [ ] Confirm access to Vercel dashboard
- [ ] Save API credentials securely

### Testing Credentials

- [ ] Add test users in OAuth consent screen
- [ ] Test with different Google accounts
- [ ] Verify error handling works
- [ ] Test token expiration scenario

## Maintenance Plan

### Regular Tasks

- [ ] Weekly: Review Vercel function logs
- [ ] Weekly: Check sync status and errors
- [ ] Monthly: Verify database backups working
- [ ] Monthly: Review and rotate secrets if needed

### Update Plan

- [ ] Document update procedure
- [ ] Set up staging environment (optional)
- [ ] Plan for zero-downtime deployments
- [ ] Test migrations before production deploy

### Backup Strategy

- [ ] Database backups enabled
- [ ] Environment variables backed up
- [ ] Code repository backed up (Git)
- [ ] Test restore procedure

## Common Issues & Solutions

### Issue: "Redirect URI mismatch"

**Solution:**
- Verify redirect URI in Google Cloud Console exactly matches
- Check for trailing slashes
- Ensure protocol matches (https in production)
- Clear browser cache and try again

### Issue: Token refresh fails

**Solution:**
- Re-authenticate to get new refresh token
- Verify `access_type: 'offline'` in OAuth request
- Check database has valid refresh token
- Review Google Cloud Console for revoked access

### Issue: Sync errors

**Solution:**
- Check Vercel function logs
- Verify Calendar API enabled
- Confirm OAuth scopes include calendar access
- Test API credentials with Postman

### Issue: Database connection errors

**Solution:**
- Verify `DATABASE_URL` correct
- Check database server running
- Confirm SSL enabled if required
- Validate IP whitelist includes Vercel IPs

## Production Checklist Summary

Before going live:

- [x] All environment variables configured
- [x] Google OAuth credentials set up
- [x] Database migrations run
- [x] Production URLs updated in Google Console
- [x] OAuth flow tested end-to-end
- [x] Sync functionality verified
- [x] Error handling tested
- [x] Security measures in place
- [x] Monitoring configured
- [x] Backup strategy implemented
- [x] Documentation complete
- [x] Support plan established

## Go-Live!

Once all checklist items complete:

1. Final test of entire flow
2. Announce to users (if applicable)
3. Monitor closely for first 24 hours
4. Have rollback plan ready
5. Document any issues encountered

## Post-Launch

- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Verify sync accuracy
- [ ] Review performance metrics
- [ ] Plan first update/improvement

## Support Contacts

- Google Cloud Console: https://console.cloud.google.com/support
- Vercel Support: https://vercel.com/support
- Database Provider Support: [Your provider's support]
- GitHub Issues: [Your repository]/issues

## Notes

Use this section for deployment-specific notes, customizations, or issues encountered:

```
[Add your notes here]
```

---

**Last Updated:** [Date]
**Deployed By:** [Name]
**Production URL:** [Your Vercel URL]
