import { CustodyCalendarEngine } from '../lib/calendar-engine';
import { format } from 'date-fns';

const engine = new CustodyCalendarEngine();

// Test December 18, 2025
const startDate = new Date(2025, 11, 18); // Dec 18, 2025
const endDate = new Date(2025, 11, 18, 23, 59, 59); // End of Dec 18

const events = engine.generateEvents(startDate, endDate);

console.log('='.repeat(80));
console.log('DECEMBER 18, 2025 - CUSTODY EVENTS');
console.log('='.repeat(80));
console.log();

events.forEach(event => {
  console.log(`${format(event.startDate, 'MMM dd, yyyy HH:mm')} → ${format(event.endDate, 'MMM dd, yyyy HH:mm')}`);
  console.log(`  Title: ${event.title}`);
  console.log(`  Parent: ${event.parent.toUpperCase()}`);
  console.log(`  Type: ${event.custodyType}`);
  console.log(`  Priority: ${event.priority}`);
  if (event.description) {
    console.log(`  Description: ${event.description}`);
  }
  console.log();
});

console.log('='.repeat(80));
console.log(`Total events: ${events.length}`);
console.log('='.repeat(80));

// Expected: ONLY Winter Break Period 1 with MOTHER
// Court Order Section 16c.i: "With Mother from school pick up 12/18 until 12/22 at 11am"
