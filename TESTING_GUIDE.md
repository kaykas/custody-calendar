# Mother-Centric UX Redesign - Testing Guide

## Quick Start Testing

After starting the development server, follow these steps to verify the redesign works correctly.

---

## Prerequisites

```bash
# Start the development server
npm run dev

# Open in browser
# Navigate to http://localhost:3000
```

---

## Visual Inspection Checklist

### 1. Page Load & First Impression

**What to Look For:**
- [ ] Page background is warm white (`#FDFCFB`), not stark white or gray
- [ ] Loading spinner is purple (not blue) with text "Loading your calendar..."
- [ ] Overall feel is warm and inviting, not clinical

**Expected Result:**
```
┌─────────────────────────────────┐
│      ⟳ Purple Spinner           │
│  Loading your calendar...       │
└─────────────────────────────────┘
Warm white background
```

---

### 2. Header Section

**What to Look For:**
- [ ] Title reads "Alexandra's Custody Calendar" (not "Custody Calendar")
- [ ] Subtitle: "Your time with the children"
- [ ] Title color is rich purple (`#7B5F9D`)
- [ ] Navigation buttons (Previous/Today/Next) have purple theme
- [ ] "Today" button is prominent with purple background and white text

**Expected Result:**
```
Alexandra's Custody Calendar
Your time with the children

[Previous] [Today] [Next]  ← Purple-themed buttons
```

---

### 3. Calendar Legend

**What to Look For:**
- [ ] "Calendar Legend" heading in purple
- [ ] "Hide Father's Time" toggle on the right side
- [ ] Mother's legend items are prominent with larger swatches
  - "Your Regular Time" (light lavender)
  - "Your Weekend" (medium lavender)
  - "Your Summer" (rich purple)
  - "Your Holiday" (deep purple with gold border)
- [ ] Father's legend item is subtle, smaller, with gray swatch
- [ ] Toggle switch turns purple when enabled

**Expected Result:**
```
┌─────────────────────────────────────────────┐
│ Calendar Legend      Hide Father's Time ⊙   │
│                                              │
│ [🟣] Your Regular Time  [🟣] Your Weekend   │
│ [🟣] Your Summer  [🟣] Your Holiday         │
│ [░░] Father's Time ← smaller, grayed        │
└─────────────────────────────────────────────┘
```

---

### 4. Calendar Grid - Day Headers

**What to Look For:**
- [ ] Day names (Sun, Mon, Tue...) have purple background
- [ ] Text color is deep purple
- [ ] Font is semibold and clear

**Expected Result:**
```
┌────┬────┬────┬────┬────┬────┬────┐
│Sun │Mon │Tue │Wed │Thu │Fri │Sat │  ← Purple headers
└────┴────┴────┴────┴────┴────┴────┘
```

---

### 5. Calendar Grid - Mother's Custody Days

**What to Look For:**
- [ ] Purple/lavender gradient backgrounds (varies by custody type)
- [ ] **Bold date numbers** (font-weight: 600)
- [ ] **2-3px borders** (thick, visible)
- [ ] Event text is **medium to large** (13-18px)
- [ ] Color is rich purple, easily readable
- [ ] **Hover effect**: Day lifts slightly, shadow increases
- [ ] Rounded corners (subtle, 2px)

**Test This:**
1. Hover over a Mother's custody day
2. Notice it lifts upward slightly
3. Shadow becomes more prominent
4. Border brightens

**Expected Visual Weight:**
```
┌─────────────────────────┐
│ 15                       │  ← Bold, large date
│                          │
│ Mother's Weekend         │  ← Medium text, clear
│ Custody                  │
│                          │
└─────────────────────────┘
  ↑ Purple gradient background
  ↑ 2-3px solid border
  ↑ Clear visual prominence
```

---

### 6. Calendar Grid - Father's Custody Days

**What to Look For:**
- [ ] Very light gray backgrounds (`#F9FAFB` to `#E5E5E5`)
- [ ] **Thin date numbers** (font-weight: 400, not bold)
- [ ] **1px borders** (thin, subtle)
- [ ] Event text is **small** (11-13px)
- [ ] Color is muted gray (`#9CA3AF`)
- [ ] Text says only "Father's custody" (not event names)
- [ ] **Diagonal stripe pattern** overlay (very subtle)
- [ ] **85% opacity** overall
- [ ] **No hover effect** (or minimal opacity change)

**Test This:**
1. Compare side-by-side with Mother's day
2. Father's day should be visually ~4x less prominent
3. Background should fade into the page
4. Border should be barely noticeable

**Expected Visual Weight:**
```
┌──────────────┐
│ 16            │  ← Thin, small date
│               │
│ Father's      │  ← Small text, muted
│ custody       │
└──────────────┘
  ↑ Light gray background
  ↑ 1px border (subtle)
  ↑ Minimal visual weight
  ↑ Appears to recede
```

---

### 7. Side-by-Side Comparison Test

**Critical Visual Test:**
Find a week where Mother and Father alternate days.

**What You Should See:**
```
Mon          Tue          Wed          Thu
┌─────────┐  ┌─────┐     ┌─────────┐  ┌─────┐
│  🟣     │  │ ░░░ │     │  🟣     │  │ ░░░ │
│ LARGE   │  │small│     │ LARGE   │  │small│
│ BOLD    │  │thin │     │ BOLD    │  │thin │
│ PURPLE  │  │gray │     │ PURPLE  │  │gray │
└─────────┘  └─────┘     └─────────┘  └─────┘
Mother       Father      Mother       Father

↑ Big, bold, vibrant     ↑ Small, thin, muted
```

**Expected Ratio:**
- Mother's day should be **4x more visually prominent**
- Father's day should **recede into background**
- But both should still be **readable** (not invisible)

---

### 8. "Hide Father's Time" Toggle Test

**Test Steps:**
1. Find the toggle in top-right of legend section
2. Click to enable (switch moves right, turns purple)
3. Father's custody days should become **blank/minimal**
4. Only date number shown in very light gray
5. No event information displayed

**Before Toggle (OFF):**
```
Mon          Tue          Wed
┌─────────┐  ┌─────┐     ┌─────────┐
│  🟣     │  │ ░░░ │     │  🟣     │
│ Mother  │  │Father│    │ Mother  │
└─────────┘  └─────┘     └─────────┘
```

**After Toggle (ON):**
```
Mon          Tue          Wed
┌─────────┐  ┌─────┐     ┌─────────┐
│  🟣     │  │ 16  │     │  🟣     │
│ Mother  │  │     │     │ Mother  │
└─────────┘  └─────┘     └─────────┘
             ↑ Just date, no info
```

**What to Verify:**
- [ ] Toggle animation is smooth (switch slides, color changes)
- [ ] Father's days immediately become minimal
- [ ] Mother's days remain unchanged
- [ ] Toggle back OFF restores father's information
- [ ] No page reload required

---

### 9. Date Selection & Sidebar

**Test Steps:**
1. Click on a Mother's custody day
2. Check the right sidebar for event details

**What to Look For (Mother's Event):**
- [ ] **Large heading** with event name
- [ ] **"Your Time"** badge (purple, prominent)
- [ ] **Full details** section with:
  - Custody type (Regular/Weekend/Summer/Holiday)
  - Exact times with day names ("Friday, 6:00 PM")
  - Description box (if present)
  - Transition indicator (pickup/dropoff times)
- [ ] Purple gradient background
- [ ] 2px solid border
- [ ] Rounded corners

**Expected (Mother's Event):**
```
┌─────────────────────────────────────┐
│ Mother's Weekend Custody  [Your Time]│  ← Large, bold
│                                      │
│ Type:     Weekend                    │  ← Full details
│ Time:     Friday, 6:00 PM -          │
│          Sunday, 6:00 PM             │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ Remember: Soccer game Sat 10am  │ │  ← Description
│ └─────────────────────────────────┘ │
│                                      │
│ ⚠️ Pickup: Friday, 6:00 PM          │  ← Transition
└─────────────────────────────────────┘
  ↑ Rich visual design, gradient background
```

**Test Steps (Father's Event):**
1. Click on a Father's custody day
2. Check sidebar for minimal information

**What to Look For (Father's Event):**
- [ ] **Small heading**: just "Father's Custody"
- [ ] **"Father"** badge (gray, subtle)
- [ ] **Minimal details**:
  - One-word custody type ("Weekend custody period")
  - Time range only (no day names)
  - No description box
  - No transition indicators
- [ ] Light gray background
- [ ] 1px border
- [ ] 80% opacity

**Expected (Father's Event):**
```
┌──────────────────────────┐
│ Father's Custody   [Father]│  ← Small, muted
│                           │
│ Weekend custody period    │  ← Minimal info
│ 6:00 PM - 6:00 PM         │
└──────────────────────────┘
  ↑ Simple, flat design, gray background
```

---

### 10. Today Indicator

**Test Steps:**
1. Navigate to current month
2. Find today's date

**What to Look For:**
- [ ] **Gold ring** around today's date (3px, `#D4AF37`)
- [ ] **Gentle pulse animation** (subtle opacity change, 2s cycle)
- [ ] Ring color stands out but is not aggressive
- [ ] Animation is smooth and calming (not jarring)

**Expected:**
```
┌─────────────────────────┐
│ 🔶 18 🔶                 │  ← Gold ring (today)
│                          │
│ Your Regular Time        │
│                          │
└─────────────────────────┘
  ↑ Gentle pulsing animation
```

---

### 11. Hover & Focus States

**Keyboard Navigation Test:**
1. Press Tab key repeatedly
2. Navigate through calendar cells

**What to Look For:**
- [ ] **Purple focus ring** appears (3px, matches mother's primary color)
- [ ] Focus ring is clearly visible
- [ ] Tab order is logical (left to right, top to bottom)
- [ ] Enter or Space key selects date and shows sidebar

**Mouse Hover Test (Mother's Days):**
1. Hover over Mother's custody days

**What to Look For:**
- [ ] Day **lifts upward 1px** (subtle transform)
- [ ] Shadow **increases in depth**
- [ ] Border **brightens** to primary purple
- [ ] Transition is **smooth** (300ms)
- [ ] Feels responsive and engaging

**Mouse Hover Test (Father's Days):**
1. Hover over Father's custody days

**What to Look For:**
- [ ] **Minimal change** (opacity increases slightly to 95%)
- [ ] **No lift effect**
- [ ] **No shadow increase**
- [ ] Subtle, not attention-grabbing

---

## Accessibility Testing

### Screen Reader Test

**Tools:** VoiceOver (Mac), NVDA (Windows), JAWS

**Test Steps:**
1. Enable screen reader
2. Navigate calendar with keyboard
3. Listen to announcements

**What to Verify:**
- [ ] Dates announced with custody info: "December 15 - Your custody"
- [ ] Toggle announced: "Toggle visibility of father's custody time"
- [ ] Event cards announced with parent info: "Your custody event" vs "Father's custody event"
- [ ] All interactive elements have proper labels

### Color Contrast Test

**Tools:** Browser DevTools, Color Contrast Analyzer

**Verify These Ratios:**
- [ ] Mother's regular time text/background: **≥ 4.5:1** (AA)
- [ ] Mother's weekend time text/background: **≥ 4.5:1** (AA)
- [ ] Father's time text/background: **≥ 4.5:1** (AA)
- [ ] Button text/background: **≥ 4.5:1** (AA)

**All should pass WCAG 2.1 Level AA minimum.**

### Zoom Test

**Test Steps:**
1. Zoom browser to 200%
2. Verify layout remains functional

**What to Verify:**
- [ ] Text remains readable
- [ ] Calendar grid doesn't break
- [ ] Sidebar remains accessible
- [ ] No horizontal scrolling required
- [ ] All interactive elements still clickable

---

## Responsive Design Test

### Desktop (1920x1080)
- [ ] Calendar grid shows 2/3 width
- [ ] Sidebar shows 1/3 width (sticky)
- [ ] All elements clearly visible
- [ ] Generous spacing and padding

### Tablet (768x1024)
- [ ] Calendar and sidebar stack vertically if needed
- [ ] Touch targets remain accessible
- [ ] Text remains readable

### Mobile (375x667)
- [ ] Calendar cells remain clickable
- [ ] Sidebar appears below or as modal
- [ ] Toggle remains accessible
- [ ] No pinch/zoom required for reading

---

## Performance Testing

### Animation Smoothness
**Test:**
1. Hover over multiple Mother's custody days quickly
2. Watch lift and shadow animations

**What to Verify:**
- [ ] No jank or stuttering
- [ ] Smooth 60fps transitions
- [ ] GPU acceleration working (transform/opacity)

### Page Load Speed
**What to Verify:**
- [ ] Initial load < 2 seconds
- [ ] CSS loads without flash of unstyled content
- [ ] Purple theme applied immediately

---

## Emotional Impact Testing

### First Impression (5-Second Test)
**Question:** In 5 seconds, what's the primary focus?

**Expected Answer:**
- "My custody time" or "Alexandra's time"
- Purple/lavender days should be most memorable
- Should feel personalized and supportive

### Father's Presence Test
**Question:** Is father's custody information present but not intrusive?

**Expected Answer:**
- Yes, you can see father's days
- But they fade into background
- Don't compete for attention
- Information is accessible if needed

### Toggle Empowerment Test
**Question:** Does the toggle feel empowering?

**Expected Answer:**
- Gives control over what you see
- No judgment (just a tool)
- Immediate feedback
- Easy to reverse

### Overall Tone Test
**Question:** What emotions does the calendar evoke?

**Expected Answer:**
- Calm, supportive, warm
- Personalized ("your" calendar)
- Empowering (control options)
- Professional but not clinical
- Dignified, not overly feminine

---

## Issue Reporting Template

If you find issues, document them with this format:

```
### Issue: [Brief description]

**Location:** [Calendar grid / Sidebar / Toggle / etc.]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Visual Evidence:**
[Screenshot or description]

**Priority:** [High / Medium / Low]
```

---

## Success Criteria Summary

The redesign is successful if:

1. ✅ **Mother's time is 4x more visually prominent** than father's
2. ✅ **Father's time is readable but recessed** (~25% visual weight)
3. ✅ **Toggle works smoothly** to hide father's time
4. ✅ **Color contrast meets WCAG AA** standards (4.5:1+)
5. ✅ **Keyboard navigation works** with clear focus indicators
6. ✅ **Screen readers announce** custody information correctly
7. ✅ **First impression is warm and personalized** (not clinical)
8. ✅ **Overall tone feels empowering** (user control, "your" language)

---

## Quick Visual Reference

### Visual Hierarchy Achieved?

```
Mother's Day:           Father's Day:
┌─────────────────┐    ┌──────────┐
│ 🟣 15           │    │ ░░ 16    │
│ BOLD            │    │ thin     │
│ LARGE TEXT      │    │ small    │
│ Rich Purple     │    │ Light Gray│
│ 2-3px border    │    │ 1px border│
│ Shadow on hover │    │ No shadow │
└─────────────────┘    └──────────┘
     100%                  25%
   (Dominant)           (Recessive)
```

**If Mother's day is NOT clearly more prominent, report an issue.**

---

## Questions During Testing?

Common questions and answers:

**Q: Should I be able to see father's custody time?**
A: Yes, unless you've enabled "Hide Father's Time" toggle. It should be visible but minimal.

**Q: Is purple the only color option?**
A: Currently yes. Future versions may allow color customization.

**Q: The contrast seems low on father's days. Is that intentional?**
A: Yes, but it should still meet 4.5:1 ratio for accessibility. If you can't read it, report an issue.

**Q: Should the calendar feel "feminine"?**
A: No. It should feel warm, dignified, and empowering - not stereotypically feminine.

---

## Final Checklist

Before marking testing complete, verify ALL of these:

- [ ] Page loads with purple theme and warm background
- [ ] Title is "Alexandra's Custody Calendar" with subtitle
- [ ] Mother's days are visually dominant (4x prominence)
- [ ] Father's days are visually recessed but readable
- [ ] Toggle hides father's time when enabled
- [ ] Hover effects work on Mother's days (lift, shadow)
- [ ] Today indicator pulses gently with gold ring
- [ ] Sidebar shows detailed info for Mother, minimal for Father
- [ ] Keyboard navigation works (tab, enter, focus rings)
- [ ] Screen reader announces custody information
- [ ] Color contrast meets WCAG AA standards
- [ ] Overall tone feels warm, supportive, empowering

**If all boxes are checked:** Redesign is successful ✅

**If any box fails:** Document issue and report for fix ⚠️

---

**Happy Testing!**
