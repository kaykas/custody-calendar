import { fromZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

// Helper function (same as in calendar-engine.ts)
function createPacificDate(year: number, month: number, date: number, hours = 0, minutes = 0, seconds = 0): Date {
  return fromZonedTime(new Date(year, month, date, hours, minutes, seconds), 'America/Los_Angeles');
}

console.log('='.repeat(80));
console.log('TIMEZONE CONVERSION TEST');
console.log('='.repeat(80));
console.log();

// Test: Dec 17, 2025 at 6:00 PM Pacific
const testDate = createPacificDate(2025, 11, 17, 18, 0, 0);

console.log('Input: Dec 17, 2025 6:00 PM Pacific');
console.log('Output as ISO string (UTC):', testDate.toISOString());
console.log('Expected: 2025-12-18T02:00:00.000Z (Dec 18, 2:00 AM UTC)');
console.log('');
console.log('Match:', testDate.toISOString() === '2025-12-18T02:00:00.000Z' ? '✅ CORRECT' : '❌ WRONG');
console.log('='.repeat(80));
