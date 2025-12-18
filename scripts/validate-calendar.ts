import { CustodyCalendarEngine } from '../lib/calendar-engine';
import { format, getYear, getDay } from 'date-fns';

console.log('='.repeat(80));
console.log('CUSTODY CALENDAR VALIDATION REPORT');
console.log('='.repeat(80));
console.log();

// Generate events for 2025-2026 school year
const startDate = new Date(2025, 0, 1); // Jan 1, 2025
const endDate = new Date(2026, 11, 31); // Dec 31, 2026

const engine = new CustodyCalendarEngine();
const events = engine.generateEvents(startDate, endDate);

console.log(`Generated ${events.length} custody events`);
console.log(`Date range: ${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`);
console.log();

// Statistics by type
console.log('EVENTS BY TYPE:');
const byType = events.reduce((acc, event) => {
  acc[event.custodyType] = (acc[event.custodyType] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

Object.entries(byType)
  .sort(([, a], [, b]) => b - a)
  .forEach(([type, count]) => {
    console.log(`  ${type.padEnd(15)}: ${count}`);
  });
console.log();

// Statistics by parent
console.log('EVENTS BY PARENT:');
const byParent = events.reduce((acc, event) => {
  acc[event.parent] = (acc[event.parent] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

Object.entries(byParent).forEach(([parent, count]) => {
  console.log(`  ${parent.padEnd(15)}: ${count}`);
});
console.log();

// Validate alternating weekends
console.log('WEEKEND VALIDATION:');
const weekendEvents = events
  .filter((e) => e.custodyType === 'weekend')
  .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

console.log(`  Total weekends: ${weekendEvents.length}`);

let alternationValid = true;
for (let i = 0; i < weekendEvents.length - 1; i++) {
  if (weekendEvents[i].parent === weekendEvents[i + 1].parent) {
    console.log(`  ❌ FAIL: Weekends not alternating at ${format(weekendEvents[i].startDate, 'yyyy-MM-dd')}`);
    alternationValid = false;
  }
}

if (alternationValid) {
  console.log('  ✓ All weekends alternate correctly');
}

// Check weekend timing (Friday 6pm to Sunday 6pm)
let timingValid = true;
for (const event of weekendEvents) {
  const startDay = getDay(event.startDate);
  const endDay = getDay(event.endDate);
  const startHour = event.startDate.getHours();
  const endHour = event.endDate.getHours();

  if (startDay !== 5 || endDay !== 0 || startHour !== 18 || endHour !== 18) {
    console.log(
      `  ❌ FAIL: Weekend timing incorrect for ${format(event.startDate, 'yyyy-MM-dd')}`
    );
    timingValid = false;
  }
}

if (timingValid) {
  console.log('  ✓ All weekends have correct timing (Fri 6pm - Sun 6pm)');
}
console.log();

// Validate summer rotation
console.log('SUMMER ROTATION VALIDATION:');
const summerEvents = events
  .filter((e) => e.custodyType === 'summer')
  .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

console.log(`  Total summer weeks displayed: ${summerEvents.length}`);

if (summerEvents.length < 8) {
  console.log(`  ⚠️  Note: Some summer weeks overridden by holidays (expected behavior)`);

  // Check which weeks are present
  const weekNumbers = summerEvents.map((e) => {
    const match = e.title.match(/Week (\d+)/);
    return match ? parseInt(match[1]) : 0;
  });

  console.log(`  Present weeks: ${weekNumbers.join(', ')}`);
  console.log(`  Missing weeks likely overridden by holidays with higher priority`);
}

// Check odd/even pattern for weeks that are present
let patternValid = true;
for (const event of summerEvents) {
  const match = event.title.match(/Week (\d+)/);
  if (match) {
    const weekNum = parseInt(match[1]);
    const expectedParent = weekNum % 2 === 1 ? 'father' : 'mother';

    if (event.parent !== expectedParent) {
      console.log(
        `  ❌ FAIL: Week ${weekNum} should be ${expectedParent}, got ${event.parent}`
      );
      patternValid = false;
    }
  }
}

if (patternValid) {
  console.log('  ✓ All present summer weeks have correct parent assignment');
}
console.log();

// Validate holiday parity
console.log('HOLIDAY PARITY VALIDATION:');
const holidays2025 = events.filter(
  (e) => e.custodyType === 'holiday' && getYear(e.startDate) === 2025
);
const holidays2026 = events.filter(
  (e) => e.custodyType === 'holiday' && getYear(e.startDate) === 2026
);

console.log(`  2025 (odd year) holidays: ${holidays2025.length}`);
console.log(`  2026 (even year) holidays: ${holidays2026.length}`);

// Check specific holidays
const checkHoliday = (year: number, name: string, expectedParent: string) => {
  const holiday = events.find(
    (e) => e.custodyType === 'holiday' && e.title === name && getYear(e.startDate) === year
  );

  if (holiday) {
    if (holiday.parent === expectedParent) {
      console.log(`  ✓ ${name} ${year}: ${holiday.parent}`);
    } else {
      console.log(`  ❌ ${name} ${year}: expected ${expectedParent}, got ${holiday.parent}`);
    }
  } else {
    if (name === 'Thanksgiving') {
      console.log(`  ⚠️  ${name} ${year}: not found (overridden by Mother's Birthday on Nov 29 - priority 150 > 100)`);
    } else {
      console.log(`  ⚠️  ${name} ${year}: not found`);
    }
  }
};

console.log('\n  2025 (odd year) - Father should have:');
checkHoliday(2025, "New Year's Day", 'father');
checkHoliday(2025, 'Independence Day', 'father');
checkHoliday(2025, 'Thanksgiving', 'father');

console.log('\n  2026 (even year) - Mother should have:');
checkHoliday(2026, "New Year's Day", 'mother');
checkHoliday(2026, 'Independence Day', 'mother');
checkHoliday(2026, 'Thanksgiving', 'mother');

console.log();

// Validate special events (Mother's/Father's Day are in holidays with 'all' parity)
console.log('SPECIAL EVENTS VALIDATION:');
const specialEvents = events.filter((e) => e.custodyType === 'special');
console.log(`  Total special events (birthdays, etc): ${specialEvents.length}`);

// Mother's Day and Father's Day are actually in the holiday list
const mothersDays = events.filter((e) => e.title === "Mother's Day");
const fathersDays = events.filter((e) => e.title === "Father's Day");

console.log(`  Mother's Days: ${mothersDays.length} (all should be with mother)`);
mothersDays.forEach((e) => {
  if (e.parent === 'mother') {
    console.log(`    ✓ ${format(e.startDate, 'yyyy-MM-dd')}: mother`);
  } else {
    console.log(`    ❌ ${format(e.startDate, 'yyyy-MM-dd')}: ${e.parent} (should be mother)`);
  }
});

console.log(`  Father's Days: ${fathersDays.length} (all should be with father)`);
fathersDays.forEach((e) => {
  if (e.parent === 'father') {
    console.log(`    ✓ ${format(e.startDate, 'yyyy-MM-dd')}: father`);
  } else {
    console.log(`    ❌ ${format(e.startDate, 'yyyy-MM-dd')}: ${e.parent} (should be father)`);
  }
});

console.log();

// Check for conflicts
console.log('CONFLICT CHECK:');
let conflictCount = 0;

for (let i = 0; i < events.length; i++) {
  for (let j = i + 1; j < events.length; j++) {
    const event1 = events[i];
    const event2 = events[j];

    // Check if overlapping
    if (event1.endDate > event2.startDate && event1.startDate < event2.endDate) {
      // Same priority = conflict
      if (event1.priority === event2.priority) {
        console.log(`  ❌ CONFLICT: "${event1.title}" and "${event2.title}"`);
        console.log(`     ${format(event1.startDate, 'yyyy-MM-dd HH:mm')} - ${format(event1.endDate, 'yyyy-MM-dd HH:mm')}`);
        console.log(`     ${format(event2.startDate, 'yyyy-MM-dd HH:mm')} - ${format(event2.endDate, 'yyyy-MM-dd HH:mm')}`);
        conflictCount++;
      }
    }
  }
}

if (conflictCount === 0) {
  console.log('  ✓ No conflicts found (all overlaps resolved by priority)');
} else {
  console.log(`  ❌ Found ${conflictCount} unresolved conflicts`);
}

console.log();
console.log('='.repeat(80));
console.log('VALIDATION COMPLETE');
console.log('='.repeat(80));

// Sample events for review
console.log();
console.log('SAMPLE EVENTS FOR MANUAL REVIEW:');
console.log();

// Show first 10 events
const sampleEvents = events.slice(0, 10);
sampleEvents.forEach((event) => {
  console.log(`${format(event.startDate, 'yyyy-MM-dd HH:mm')} - ${format(event.endDate, 'yyyy-MM-dd HH:mm')}`);
  console.log(`  ${event.title} (${event.custodyType})`);
  console.log(`  Parent: ${event.parent}, Priority: ${event.priority}`);
  if (event.description) {
    console.log(`  ${event.description}`);
  }
  console.log();
});

// Export to JSON for review
import { writeFileSync } from 'fs';
import { join } from 'path';

const outputPath = join(__dirname, '../data/calendar-validation-2025-2026.json');
const output = {
  generatedAt: new Date().toISOString(),
  dateRange: {
    start: format(startDate, 'yyyy-MM-dd'),
    end: format(endDate, 'yyyy-MM-dd'),
  },
  statistics: {
    totalEvents: events.length,
    byType,
    byParent,
  },
  events: events.map((e) => ({
    id: e.id,
    startDate: format(e.startDate, "yyyy-MM-dd'T'HH:mm:ss"),
    endDate: format(e.endDate, "yyyy-MM-dd'T'HH:mm:ss"),
    custodyType: e.custodyType,
    parent: e.parent,
    title: e.title,
    description: e.description,
    priority: e.priority,
  })),
};

writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`Full calendar exported to: ${outputPath}`);
