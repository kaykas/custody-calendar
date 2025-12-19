import { CustodyCalendarEngine } from '../lib/calendar-engine';
import { format } from 'date-fns';

const engine = new CustodyCalendarEngine();

// Test wider range around Dec 18
const startDate = new Date(2025, 11, 15); // Dec 15, 2025
const endDate = new Date(2025, 11, 20); // Dec 20, 2025

const events = engine.generateEvents(startDate, endDate);

console.log('='.repeat(80));
console.log('DECEMBER 15-20, 2025 - ALL CUSTODY EVENTS');
console.log('='.repeat(80));
console.log();

// Focus on events that overlap Dec 18
const dec18Start = new Date(2025, 11, 18, 0, 0, 0);
const dec18End = new Date(2025, 11, 18, 23, 59, 59);

console.log('Events that overlap December 18, 2025:');
console.log('-'.repeat(80));

events.forEach(event => {
  const eventStart = new Date(event.startDate);
  const eventEnd = new Date(event.endDate);

  // Check if event overlaps Dec 18
  const overlaps = eventStart <= dec18End && eventEnd >= dec18Start;

  if (overlaps) {
    console.log(`\n${format(event.startDate, 'MMM dd, yyyy HH:mm')} → ${format(event.endDate, 'MMM dd, yyyy HH:mm')}`);
    console.log(`  ID: ${event.id}`);
    console.log(`  Title: ${event.title}`);
    console.log(`  Parent: ${event.parent.toUpperCase()}`);
    console.log(`  Type: ${event.custodyType}`);
    console.log(`  Priority: ${event.priority}`);
    if (event.description) {
      console.log(`  Description: ${event.description.substring(0, 100)}...`);
    }
  }
});

console.log('\n' + '='.repeat(80));
console.log('Expected: ONLY Winter Break Period 1 with MOTHER');
console.log('Court Order Section 16c.i: "With Mother from school pick up 12/18 until 12/22 at 11am"');
console.log('='.repeat(80));
