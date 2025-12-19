import { CustodyCalendarEngine } from '../lib/calendar-engine';
import { format } from 'date-fns';

// Create engine with 2026 summer dates
const summer2026Start = new Date(2026, 5, 7); // June 7, 2026
const summer2026End = new Date(2026, 7, 1); // August 1, 2026 (8 weeks later)
const engine = new CustodyCalendarEngine(summer2026Start, summer2026End);

// Test summer 2026
const startDate = new Date(2026, 5, 1); // June 1, 2026
const endDate = new Date(2026, 7, 31); // Aug 31, 2026

const events = engine.generateEvents(startDate, endDate);

console.log('='.repeat(80));
console.log('SUMMER 2026 CUSTODY SCHEDULE');
console.log('='.repeat(80));
console.log();

// Filter to summer weeks
const summerWeeks = events.filter(e => e.custodyType === 'summer');

console.log('SUMMER WEEK ASSIGNMENTS:');
console.log('-'.repeat(80));
summerWeeks.forEach(event => {
  console.log(`${format(event.startDate, 'MMM dd, yyyy')} → ${format(event.endDate, 'MMM dd, yyyy')}`);
  console.log(`  ${event.title}`);
  console.log(`  Parent: ${event.parent.toUpperCase()}`);
  console.log(`  ${event.description}`);
  console.log();
});

console.log('='.repeat(80));
console.log('COURT ORDER VERIFICATION:');
console.log('-'.repeat(80));
console.log('Court Order Section 14c states:');
console.log('  Mother: 1st, 3rd, 5th, 7th weeks');
console.log('  Father: 2nd, 4th, 6th, 8th weeks');
console.log();
console.log('Verification:');
summerWeeks.forEach((event, index) => {
  const weekNum = index + 1;
  const expectedParent = weekNum % 2 === 1 ? 'MOTHER' : 'FATHER';
  const actualParent = event.parent.toUpperCase();
  const status = expectedParent === actualParent ? '✅ CORRECT' : '❌ INCORRECT';
  console.log(`  Week ${weekNum}: Expected ${expectedParent}, Got ${actualParent} ${status}`);
});
