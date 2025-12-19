import { CustodyCalendarEngine } from '../lib/calendar-engine';
import { format } from 'date-fns';

const engine = new CustodyCalendarEngine();

// Generate events for January 2026
const startDate = new Date(2026, 0, 1); // Jan 1, 2026
const endDate = new Date(2026, 0, 31); // Jan 31, 2026

const events = engine.generateEvents(startDate, endDate);

console.log('='.repeat(80));
console.log('JANUARY 2026 CUSTODY EVENTS');
console.log('='.repeat(80));
console.log();

// Filter to just Thursdays
const thursdays = events.filter(e => {
  const day = e.startDate.getDay();
  return day === 4; // Thursday = 4
});

console.log('THURSDAY EVENTS:');
console.log('-'.repeat(80));
thursdays.forEach(event => {
  console.log(`${format(event.startDate, 'MMM dd, yyyy HH:mm')} → ${format(event.endDate, 'MMM dd, yyyy HH:mm')}`);
  console.log(`  ${event.title}`);
  console.log(`  Parent: ${event.parent.toUpperCase()}, Type: ${event.custodyType}, Priority: ${event.priority}`);
  if (event.description) {
    console.log(`  ${event.description}`);
  }
  console.log();
});

console.log('='.repeat(80));
console.log('ALL JANUARY EVENTS:');
console.log('-'.repeat(80));
events.forEach(event => {
  console.log(`${format(event.startDate, 'MMM dd, yyyy HH:mm')} → ${format(event.endDate, 'MMM dd, yyyy HH:mm')}`);
  console.log(`  ${event.title} - ${event.parent.toUpperCase()}`);
  console.log();
});
