import { CustodyCalendarEngine } from '../lib/calendar-engine.ts';
import { format, isWithinInterval } from 'date-fns';

console.log('='.repeat(80));
console.log('DECEMBER 2025 VALIDATION REPORT');
console.log('Validating against court order requirements');
console.log('='.repeat(80));
console.log();

const engine = new CustodyCalendarEngine();

// Generate events for December 2025 through January 2026
const startDate = new Date(2025, 11, 1); // Dec 1, 2025
const endDate = new Date(2026, 0, 10); // Jan 10, 2026

const events = engine.generateEvents(startDate, endDate);

console.log(`Generated ${events.length} custody events for Dec 2025 - Jan 2026`);
console.log();

// Filter to winter break and December events
const decemberEvents = events.filter((e) => {
  const eventDate = e.startDate;
  return (
    (eventDate.getMonth() === 11 && eventDate.getFullYear() === 2025) ||
    (eventDate.getMonth() === 0 && eventDate.getFullYear() === 2026 && eventDate.getDate() <= 10)
  );
});

console.log('DECEMBER 2025 EVENTS:');
console.log('-'.repeat(80));
decemberEvents.forEach((event) => {
  console.log(
    `${format(event.startDate, 'MMM dd, yyyy HH:mm')} → ${format(event.endDate, 'MMM dd, yyyy HH:mm')}`
  );
  console.log(`  ${event.title}`);
  console.log(`  Parent: ${event.parent.toUpperCase()}, Type: ${event.custodyType}, Priority: ${event.priority}`);
  if (event.description) {
    console.log(`  ${event.description}`);
  }
  console.log();
});

console.log('='.repeat(80));
console.log('COURT ORDER VALIDATION');
console.log('='.repeat(80));
console.log();

// Validation criteria from court order
const validations = [
  {
    name: 'Dec 18-22, 2025: Mother custody',
    checkDate: new Date(2025, 11, 20, 12, 0, 0), // Dec 20, noon
    expectedParent: 'mother',
    expectedEvent: 'Winter Break 2025 - Period 1',
  },
  {
    name: 'Dec 22-25, 2025: Father custody',
    checkDate: new Date(2025, 11, 23, 12, 0, 0), // Dec 23, noon
    expectedParent: 'father',
    expectedEvent: 'Winter Break 2025 - Period 2',
  },
  {
    name: 'Dec 25-29, 2025: Mother custody',
    checkDate: new Date(2025, 11, 27, 12, 0, 0), // Dec 27, noon
    expectedParent: 'mother',
    expectedEvent: 'Winter Break 2025 - Period 3',
  },
  {
    name: 'Dec 29-Jan 2, 2025: Father custody',
    checkDate: new Date(2025, 11, 31, 12, 0, 0), // Dec 31, noon
    expectedParent: 'father',
    expectedEvent: 'Winter Break 2025 - Period 4',
  },
  {
    name: 'Jan 2-5, 2026: Mother custody',
    checkDate: new Date(2026, 0, 3, 12, 0, 0), // Jan 3, noon
    expectedParent: 'mother',
    expectedEvent: 'Winter Break 2025 - Period 5',
  },
];

let allValidationsPassed = true;

validations.forEach((validation) => {
  const result = engine.getCustodyForDate(validation.checkDate);
  const passed = result.parent === validation.expectedParent;
  const eventMatch = result.event?.title === validation.expectedEvent;

  const status = passed && eventMatch ? '✓ PASS' : '✗ FAIL';
  console.log(`${status}: ${validation.name}`);
  console.log(`  Expected: ${validation.expectedParent} - ${validation.expectedEvent}`);
  console.log(
    `  Got: ${result.parent} - ${result.event?.title || 'No event found'}`
  );

  if (!passed || !eventMatch) {
    allValidationsPassed = false;
    console.log('  ⚠️  VALIDATION FAILED!');
  }
  console.log();
});

// Check specific birthday
console.log('BIRTHDAY VALIDATIONS:');
console.log('-'.repeat(80));

const alexandraBirthday = new Date(2025, 9, 2, 12, 0, 0); // Oct 2, 2025
const alexandraResult = engine.getCustodyForDate(alexandraBirthday);
const alexandraPassed = alexandraResult.parent === 'mother';
console.log(
  `${alexandraPassed ? '✓ PASS' : '✗ FAIL'}: Alexandra's Birthday (Oct 2, 2025)`
);
console.log(`  Expected: mother`);
console.log(`  Got: ${alexandraResult.parent}`);
if (!alexandraPassed) allValidationsPassed = false;
console.log();

const scottBirthday = new Date(2025, 11, 31, 12, 0, 0); // Dec 31, 2025
const scottResult = engine.getCustodyForDate(scottBirthday);
const scottPassed = scottResult.parent === 'father';
console.log(
  `${scottPassed ? '✓ PASS' : '✗ FAIL'}: Scott's Birthday (Dec 31, 2025)`
);
console.log(`  Expected: father`);
console.log(`  Got: ${scottResult.parent}`);
if (!scottPassed) allValidationsPassed = false;
console.log();

// Check Halloween 2025 (odd year = mother)
const halloween2025 = new Date(2025, 9, 31, 12, 0, 0); // Oct 31, 2025
const halloweenResult = engine.getCustodyForDate(halloween2025);
const halloweenPassed = halloweenResult.parent === 'mother';
console.log(
  `${halloweenPassed ? '✓ PASS' : '✗ FAIL'}: Halloween 2025 (odd year)`
);
console.log(`  Expected: mother`);
console.log(`  Got: ${halloweenResult.parent}`);
if (!halloweenPassed) allValidationsPassed = false;
console.log();

console.log('='.repeat(80));
if (allValidationsPassed) {
  console.log('✓ ALL VALIDATIONS PASSED!');
  console.log('December 2025 schedule matches court order requirements.');
} else {
  console.log('✗ SOME VALIDATIONS FAILED!');
  console.log('Please review the implementation.');
}
console.log('='.repeat(80));

// Check for overlapping events with same priority (conflicts)
console.log();
console.log('CONFLICT CHECK:');
console.log('-'.repeat(80));

let conflictCount = 0;
for (let i = 0; i < decemberEvents.length; i++) {
  for (let j = i + 1; j < decemberEvents.length; j++) {
    const event1 = decemberEvents[i];
    const event2 = decemberEvents[j];

    // Check if overlapping
    if (event1.endDate > event2.startDate && event1.startDate < event2.endDate) {
      // Same priority = conflict
      if (event1.priority === event2.priority) {
        console.log(`✗ CONFLICT: "${event1.title}" and "${event2.title}"`);
        console.log(
          `   ${format(event1.startDate, 'MMM dd HH:mm')} - ${format(event1.endDate, 'MMM dd HH:mm')}`
        );
        console.log(
          `   ${format(event2.startDate, 'MMM dd HH:mm')} - ${format(event2.endDate, 'MMM dd HH:mm')}`
        );
        conflictCount++;
      }
    }
  }
}

if (conflictCount === 0) {
  console.log('✓ No conflicts found');
} else {
  console.log(`✗ Found ${conflictCount} conflicts`);
}

console.log();
console.log('='.repeat(80));
console.log('VALIDATION COMPLETE');
console.log('='.repeat(80));

process.exit(allValidationsPassed ? 0 : 1);
