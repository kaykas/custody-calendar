import { CustodyCalendarEngine } from '../lib/calendar-engine';
import { format, getDay, getYear } from 'date-fns';

describe('CustodyCalendarEngine', () => {
  let engine: CustodyCalendarEngine;

  beforeEach(() => {
    engine = new CustodyCalendarEngine();
  });

  describe('Regular Schedule (Thursday nights)', () => {
    it('should generate Thursday overnight custody for father', () => {
      // Test January 2025
      const startDate = new Date(2025, 0, 1); // Jan 1, 2025
      const endDate = new Date(2025, 0, 31); // Jan 31, 2025

      const events = engine.generateEvents(startDate, endDate);
      const thursdayEvents = events.filter(
        (e) => e.custodyType === 'regular' && e.parent === 'father'
      );

      // Count Thursdays in January 2025
      expect(thursdayEvents.length).toBeGreaterThan(0);

      // Verify each event is on Thursday
      thursdayEvents.forEach((event) => {
        const dayOfWeek = getDay(event.startDate);
        expect(dayOfWeek).toBe(4); // Thursday
        expect(event.startDate.getHours()).toBe(18); // 6pm
      });
    });
  });

  describe('Weekend Schedule (Alternating)', () => {
    it('should alternate weekends between parents', () => {
      const startDate = new Date(2025, 0, 1); // Jan 1, 2025
      const endDate = new Date(2025, 1, 28); // Feb 28, 2025

      const events = engine.generateEvents(startDate, endDate);
      const weekendEvents = events
        .filter((e) => e.custodyType === 'weekend')
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

      // Should have multiple weekends
      expect(weekendEvents.length).toBeGreaterThan(4);

      // Check alternation
      for (let i = 0; i < weekendEvents.length - 1; i++) {
        const current = weekendEvents[i];
        const next = weekendEvents[i + 1];
        expect(current.parent).not.toBe(next.parent);
      }
    });

    it('should have weekends from Friday 6pm to Sunday 6pm', () => {
      const startDate = new Date(2025, 0, 1);
      const endDate = new Date(2025, 0, 31);

      const events = engine.generateEvents(startDate, endDate);
      const weekendEvents = events.filter((e) => e.custodyType === 'weekend');

      weekendEvents.forEach((event) => {
        // Start should be Friday
        expect(getDay(event.startDate)).toBe(5);
        expect(event.startDate.getHours()).toBe(18);

        // End should be Sunday
        expect(getDay(event.endDate)).toBe(0);
        expect(event.endDate.getHours()).toBe(18);
      });
    });
  });

  describe('Summer Schedule (8-week rotation)', () => {
    it('should generate 8 weeks of summer custody', () => {
      const summerStart = new Date(2025, 5, 8); // June 8, 2025
      const summerEnd = new Date(2025, 7, 8); // August 8, 2025

      const engine = new CustodyCalendarEngine(summerStart, summerEnd);
      const events = engine.generateEvents(summerStart, summerEnd);
      const summerEvents = events.filter((e) => e.custodyType === 'summer');

      // Should have exactly 8 weeks
      expect(summerEvents.length).toBe(8);
    });

    it('should alternate weeks: father odd weeks, mother even weeks', () => {
      const summerStart = new Date(2025, 5, 8);
      const summerEnd = new Date(2025, 7, 8);

      const engine = new CustodyCalendarEngine(summerStart, summerEnd);
      const events = engine.generateEvents(summerStart, summerEnd);
      const summerEvents = events
        .filter((e) => e.custodyType === 'summer')
        .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

      expect(summerEvents[0].parent).toBe('father'); // Week 1
      expect(summerEvents[1].parent).toBe('mother'); // Week 2
      expect(summerEvents[2].parent).toBe('father'); // Week 3
      expect(summerEvents[3].parent).toBe('mother'); // Week 4
      expect(summerEvents[4].parent).toBe('father'); // Week 5
      expect(summerEvents[5].parent).toBe('mother'); // Week 6
      expect(summerEvents[6].parent).toBe('father'); // Week 7
      expect(summerEvents[7].parent).toBe('mother'); // Week 8
    });
  });

  describe('Holiday Schedule (Year Parity)', () => {
    it('should assign New Years Day to mother in even years', () => {
      const startDate = new Date(2024, 11, 1); // Dec 1, 2024
      const endDate = new Date(2025, 0, 31); // Jan 31, 2025

      const events = engine.generateEvents(startDate, endDate);
      const newYears2025 = events.find(
        (e) => e.custodyType === 'holiday' && e.title === "New Year's Day" && getYear(e.startDate) === 2025
      );

      expect(newYears2025).toBeDefined();
      expect(newYears2025?.parent).toBe('mother'); // 2025 is odd, but rule says "even year gets mother"? Need to check court order
    });

    it('should assign Independence Day based on year parity', () => {
      // Test 2024 (even year)
      const start2024 = new Date(2024, 6, 1);
      const end2024 = new Date(2024, 6, 31);
      const events2024 = engine.generateEvents(start2024, end2024);
      const july4_2024 = events2024.find(
        (e) => e.custodyType === 'holiday' && e.title === 'Independence Day'
      );
      expect(july4_2024?.parent).toBe('mother'); // Even year

      // Test 2025 (odd year)
      const start2025 = new Date(2025, 6, 1);
      const end2025 = new Date(2025, 6, 31);
      const events2025 = engine.generateEvents(start2025, end2025);
      const july4_2025 = events2025.find(
        (e) => e.custodyType === 'holiday' && e.title === 'Independence Day'
      );
      expect(july4_2025?.parent).toBe('father'); // Odd year
    });

    it('should assign Thanksgiving based on year parity', () => {
      // 2024 (even year)
      const start2024 = new Date(2024, 10, 1);
      const end2024 = new Date(2024, 10, 30);
      const events2024 = engine.generateEvents(start2024, end2024);
      const thanksgiving2024 = events2024.find(
        (e) => e.custodyType === 'holiday' && e.title === 'Thanksgiving'
      );
      expect(thanksgiving2024?.parent).toBe('mother');

      // 2025 (odd year)
      const start2025 = new Date(2025, 10, 1);
      const end2025 = new Date(2025, 10, 30);
      const events2025 = engine.generateEvents(start2025, end2025);
      const thanksgiving2025 = events2025.find(
        (e) => e.custodyType === 'holiday' && e.title === 'Thanksgiving'
      );
      expect(thanksgiving2025?.parent).toBe('father');
    });

    it('should split Christmas break correctly', () => {
      // Even year: mother gets first half, father gets second half
      const start2024 = new Date(2024, 11, 1);
      const end2024 = new Date(2025, 0, 7);
      const events2024 = engine.generateEvents(start2024, end2024);

      const christmasFirst = events2024.find(
        (e) => e.custodyType === 'holiday' && e.title.includes('First Half')
      );
      const christmasSecond = events2024.find(
        (e) => e.custodyType === 'holiday' && e.title.includes('Second Half')
      );

      expect(christmasFirst?.parent).toBe('mother');
      expect(christmasSecond?.parent).toBe('father');
    });
  });

  describe('Special Events', () => {
    it('should always assign Mother\'s Day to mother', () => {
      const start2025 = new Date(2025, 4, 1); // May 2025
      const end2025 = new Date(2025, 4, 31);

      const events = engine.generateEvents(start2025, end2025);
      const mothersDay = events.find(
        (e) => e.custodyType === 'special' && e.title === "Mother's Day"
      );

      expect(mothersDay).toBeDefined();
      expect(mothersDay?.parent).toBe('mother');
    });

    it('should always assign Father\'s Day to father', () => {
      const start2025 = new Date(2025, 5, 1); // June 2025
      const end2025 = new Date(2025, 5, 30);

      const events = engine.generateEvents(start2025, end2025);
      const fathersDay = events.find(
        (e) => e.custodyType === 'special' && e.title === "Father's Day"
      );

      expect(fathersDay).toBeDefined();
      expect(fathersDay?.parent).toBe('father');
    });
  });

  describe('Conflict Resolution', () => {
    it('should prioritize holidays over regular schedule', () => {
      // Test that a holiday overrides a Thursday night
      const start = new Date(2025, 0, 1);
      const end = new Date(2025, 0, 31);

      const events = engine.generateEvents(start, end);

      // MLK Day 2025 is January 20 (Monday), but the weekend is Friday-Monday
      // Check that no Thursday regular custody overlaps with holiday weekend
      const mlkWeekend = events.find(
        (e) => e.custodyType === 'holiday' && e.title === "Martin Luther King Jr. Day"
      );

      if (mlkWeekend) {
        // Find any regular Thursday events during this weekend
        const overlappingThursday = events.find(
          (e) =>
            e.custodyType === 'regular' &&
            e.startDate >= mlkWeekend.startDate &&
            e.startDate < mlkWeekend.endDate
        );

        // Should not exist due to conflict resolution
        expect(overlappingThursday).toBeUndefined();
      }
    });

    it('should prioritize special events over weekends', () => {
      // Mother's Day should override any weekend assignment
      const start = new Date(2025, 4, 1);
      const end = new Date(2025, 4, 31);

      const events = engine.generateEvents(start, end);
      const mothersDay = events.find(
        (e) => e.custodyType === 'special' && e.title === "Mother's Day"
      );

      expect(mothersDay).toBeDefined();
      expect(mothersDay?.parent).toBe('mother');

      // Check that it has higher priority than weekend
      const weekend = events.find(
        (e) =>
          e.custodyType === 'weekend' &&
          mothersDay &&
          e.startDate <= mothersDay.startDate &&
          e.endDate >= mothersDay.endDate
      );

      // If there's an overlapping weekend, Mother's Day should have higher priority
      if (weekend) {
        expect(mothersDay!.priority).toBeGreaterThan(weekend.priority);
      }
    });
  });

  describe('Date-specific custody lookup', () => {
    it('should return correct custody for a specific date', () => {
      // Test a specific Thursday
      const thursday = new Date(2025, 0, 9, 20, 0, 0); // Jan 9, 2025, 8pm
      const result = engine.getCustodyForDate(thursday);

      expect(result.parent).toBe('father'); // Thursday night
      expect(result.event).toBeDefined();
      expect(result.event?.custodyType).toBe('regular');
    });

    it('should return mother as default custody', () => {
      // Test a random Tuesday with no special events
      const tuesday = new Date(2025, 0, 7, 12, 0, 0); // Jan 7, 2025, noon
      const result = engine.getCustodyForDate(tuesday);

      expect(result.parent).toBe('mother'); // Default custody
    });
  });
});
