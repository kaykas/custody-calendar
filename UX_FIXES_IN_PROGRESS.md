# UX Fixes In Progress - PAUSE POINT
**Date:** December 18, 2025
**Status:** Partially Complete - Ready to Resume

## User-Reported Issues (Screenshot Analysis)

### Critical Issues Found:
1. **Multi-day event display bug**: Shows "6:00 AM - 6:00 AM" instead of full date range
2. **Missing exchange locations**: Winter break exchanges don't specify WHERE they happen
3. **Confusing pickup indicator**: Orange box shows wrong context for mid-break exchanges
4. **Google Calendar sync button not visible**: User can't find sync functionality

## Fixes Completed ✓

### 1. Time Display Fix (CalendarView.tsx line 417-422)
**Changed:**
```typescript
// BEFORE:
{format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}

// AFTER:
{format(new Date(event.startDate), 'MMM d, h:mm a')} - {format(new Date(event.endDate), 'MMM d, h:mm a')}
```
**Result:** Now shows "Dec 25, 11:00 AM - Dec 29, 11:00 AM" instead of "6:00 AM - 6:00 AM"

### 2. Exchange Location Details (calendar-engine.ts lines 551-585)
**Added curbside exchange locations per Court Order Section 12.c:**
- "If school is not in session exchanges shall occur at the receiving parent's home, curbside"

**Updated descriptions:**
- Period 2: "Exchange at Mother's home, curbside at 11:00 AM on Dec 22 → Exchange at Father's home, curbside at 11:00 AM on Dec 25"
- Period 3: "Exchange at Father's home, curbside at 11:00 AM on Dec 25 → Exchange at Mother's home, curbside at 11:00 AM on Dec 29"
- Period 4: "Exchange at Mother's home, curbside at 11:00 AM on Dec 29 → Exchange at Father's home, curbside at 11:00 AM on Jan 2"

### 3. Removed Confusing Pickup Indicator (CalendarView.tsx line 431)
**Changed:**
```typescript
// BEFORE: Generic "Pickup: Thursday, 6:00 AM" for all holidays
// AFTER: Removed - details now in event description
```

## Fixes Still Needed ⚠️

### 4. Google Calendar Sync Button - NOT STARTED
**Current state:** Sync functionality exists (`/api/sync/google`) but no UI button visible

**Action needed:**
- Add prominent "Sync with Google Calendar" button to CalendarView header
- Show sync status (authenticated/not authenticated)
- Add visual feedback for sync success/failure

**Location to add:** Header section of CalendarView.tsx around lines 97-140

### 5. Period 1 Missing Exchange Location
**Current:** "Pickup at Thornhill Elementary... → Exchange at 11:00 AM on Dec 22"
**Need:** "→ Exchange at Mother's home, curbside at 11:00 AM on Dec 22"

**File:** lib/calendar-engine.ts line 547

### 6. Weekend/Regular Schedule - Curbside Info Missing
**Current:** Weekend descriptions show school pickups but don't mention curbside exchanges for non-school days
**Need:** Add "(curbside exchange at receiving parent's home)" for non-school days

**Files to update:**
- lib/calendar-engine.ts lines 331-351 (weekends)
- lib/school-schedule.ts lines 189-213 (getPickupDropoffDescription function)

### 7. UX Review Agent - NOT STARTED
**Action needed:** Launch UX agent to review overall calendar usability after fixes deployed

## Testing Required

### Before Deploying:
1. Run build: `npm run build`
2. Run validation: `npm run validate:dec2025`
3. Check Dec 25 event display (should show full date range)
4. Verify all winter break descriptions include exchange locations

### After Deploying:
1. View December 2025 in browser
2. Click Dec 25 - verify shows "Dec 25, 11:00 AM - Dec 29, 11:00 AM"
3. Verify description shows "Exchange at Father's home, curbside..."
4. Test all 5 winter break periods for correct locations

## Quick Resume Commands

```bash
cd /Users/jkw/Projects/custody-calendar

# 1. Complete remaining fixes (Period 1 exchange location)
# Edit lib/calendar-engine.ts line 547

# 2. Add Google Calendar sync button
# Edit components/CalendarView.tsx header section

# 3. Build and test
npm run build
npm run validate:dec2025

# 4. Deploy
git add -A
git commit -m "Fix UX issues: multi-day display, exchange locations, sync button"
git push
vercel --prod
```

## Court Order Reference (Critical Section)

**Page 3, Section 12.c:**
> "If school is not in session exchanges shall occur at the receiving parent's home, curbside."

**Who is "receiving parent"?**
- Dec 22 exchange: Mother receives → Mother's home
- Dec 25 exchange: Father receives → Father's home
- Dec 29 exchange: Mother receives → Mother's home
- Jan 2 exchange: Father receives → Father's home

## Current Todo List Status
- [x] Fix multi-day event time display in CalendarView
- [x] Add exchange location details to winter break Periods 2-4
- [ ] Add exchange location to Period 1 (Dec 18-22)
- [ ] Add curbside exchange info to regular schedule
- [ ] Add visible Google Calendar sync button to UI
- [ ] Test updated calendar display
- [ ] Deploy fixes to production

## Files Modified (Need to Commit)
1. `/Users/jkw/Projects/custody-calendar/components/CalendarView.tsx` (time display, removed pickup indicator)
2. `/Users/jkw/Projects/custody-calendar/lib/calendar-engine.ts` (exchange locations Periods 2-4)

## Files Still Need Changes
1. `/Users/jkw/Projects/custody-calendar/lib/calendar-engine.ts` (Period 1 location, line 547)
2. `/Users/jkw/Projects/custody-calendar/components/CalendarView.tsx` (add sync button, lines 97-140)
3. `/Users/jkw/Projects/custody-calendar/lib/school-schedule.ts` (optional: curbside note for non-school)

## Important Context for Next Session
- School schedule integration already complete (Thornhill Elementary bell times)
- All court order validations passing (8/8 tests)
- Production deployment working at https://custody-calendar.vercel.app
- User specifically needs clarity on WHERE exchanges happen during breaks
- User finds current UX confusing and wants clear, actionable information
