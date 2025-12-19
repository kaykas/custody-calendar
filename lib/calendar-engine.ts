import {
  startOfDay,
  endOfDay,
  addDays,
  addWeeks,
  isWithinInterval,
  isSameDay,
  getYear,
  format,
  parse,
  differenceInDays,
  startOfWeek,
  getDay,
} from 'date-fns';
import { getPickupDropoffDescription, thornhillSchedule } from './school-schedule';

export interface CustodyEvent {
  id: string;
  startDate: Date;
  endDate: Date;
  custodyType: 'regular' | 'weekend' | 'summer' | 'holiday' | 'special';
  parent: 'mother' | 'father';
  title: string;
  description?: string;
  priority: number;
}

export interface HolidayRule {
  name: string;
  yearParity: 'even' | 'odd' | 'all';
  parent: 'mother' | 'father';
  dateRule: string | ((year: number) => Date);
  priority: number;
}

// Court order holidays with year parity
const HOLIDAYS: HolidayRule[] = [
  // Mother's holidays (even years)
  {
    name: "New Year's Day",
    yearParity: 'even',
    parent: 'mother',
    dateRule: '01-01',
    priority: 100,
  },
  {
    name: "Martin Luther King Jr. Day",
    yearParity: 'even',
    parent: 'mother',
    dateRule: (year: number) => getNthWeekdayOfMonth(year, 0, 1, 3), // 3rd Monday of January
    priority: 100,
  },
  {
    name: "Presidents' Day",
    yearParity: 'even',
    parent: 'mother',
    dateRule: (year: number) => getNthWeekdayOfMonth(year, 1, 1, 3), // 3rd Monday of February
    priority: 100,
  },
  {
    name: "Spring Break",
    yearParity: 'even',
    parent: 'mother',
    dateRule: '03-15', // Placeholder - needs school district calendar
    priority: 100,
  },
  {
    name: "Memorial Day",
    yearParity: 'even',
    parent: 'mother',
    dateRule: (year: number) => getLastWeekdayOfMonth(year, 4, 1), // Last Monday of May
    priority: 100,
  },
  {
    name: "Independence Day",
    yearParity: 'even',
    parent: 'mother',
    dateRule: '07-04',
    priority: 100,
  },
  {
    name: "Labor Day",
    yearParity: 'even',
    parent: 'mother',
    dateRule: (year: number) => getNthWeekdayOfMonth(year, 8, 1, 1), // 1st Monday of September
    priority: 100,
  },
  {
    name: "Halloween",
    yearParity: 'even',
    parent: 'father',
    dateRule: '10-31',
    priority: 100,
  },
  {
    name: "Thanksgiving",
    yearParity: 'even',
    parent: 'mother',
    dateRule: (year: number) => getNthWeekdayOfMonth(year, 10, 4, 4), // 4th Thursday of November
    priority: 100,
  },
  // Winter Break is handled separately in generateWinterBreak() method

  // Father's holidays (odd years)
  {
    name: "New Year's Day",
    yearParity: 'odd',
    parent: 'father',
    dateRule: '01-01',
    priority: 100,
  },
  {
    name: "Martin Luther King Jr. Day",
    yearParity: 'odd',
    parent: 'father',
    dateRule: (year: number) => getNthWeekdayOfMonth(year, 0, 1, 3),
    priority: 100,
  },
  {
    name: "Presidents' Day",
    yearParity: 'odd',
    parent: 'father',
    dateRule: (year: number) => getNthWeekdayOfMonth(year, 1, 1, 3),
    priority: 100,
  },
  {
    name: "Spring Break",
    yearParity: 'odd',
    parent: 'father',
    dateRule: '03-15',
    priority: 100,
  },
  {
    name: "Memorial Day",
    yearParity: 'odd',
    parent: 'father',
    dateRule: (year: number) => getLastWeekdayOfMonth(year, 4, 1),
    priority: 100,
  },
  {
    name: "Independence Day",
    yearParity: 'odd',
    parent: 'father',
    dateRule: '07-04',
    priority: 100,
  },
  {
    name: "Labor Day",
    yearParity: 'odd',
    parent: 'father',
    dateRule: (year: number) => getNthWeekdayOfMonth(year, 8, 1, 1),
    priority: 100,
  },
  {
    name: "Halloween",
    yearParity: 'odd',
    parent: 'mother',
    dateRule: '10-31',
    priority: 100,
  },
  {
    name: "Thanksgiving",
    yearParity: 'odd',
    parent: 'father',
    dateRule: (year: number) => getNthWeekdayOfMonth(year, 10, 4, 4),
    priority: 100,
  },
  // Winter Break is handled separately in generateWinterBreak() method

  // Special events (every year)
  {
    name: "Mother's Day",
    yearParity: 'all',
    parent: 'mother',
    dateRule: (year: number) => getNthWeekdayOfMonth(year, 4, 0, 2), // 2nd Sunday of May
    priority: 150,
  },
  {
    name: "Father's Day",
    yearParity: 'all',
    parent: 'father',
    dateRule: (year: number) => getNthWeekdayOfMonth(year, 5, 0, 3), // 3rd Sunday of June
    priority: 150,
  },
];

// Helper functions for date calculations
function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  nth: number
): Date {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = getDay(firstDay);
  const diff = (weekday - firstWeekday + 7) % 7;
  const date = 1 + diff + (nth - 1) * 7;
  return new Date(year, month, date);
}

function getLastWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number
): Date {
  const lastDay = new Date(year, month + 1, 0);
  const lastWeekday = getDay(lastDay);
  const diff = (lastWeekday - weekday + 7) % 7;
  const date = lastDay.getDate() - diff;
  return new Date(year, month, date);
}

function parseHolidayDate(dateRule: string, year: number): Date {
  const [month, day] = dateRule.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export class CustodyCalendarEngine {
  private summerStartDate: Date;
  private summerEndDate: Date;

  constructor(
    // TODO: Implement school calendar configuration system
    // Summer dates should be calculated based on actual school district calendar
    // For 2025-2026 school year, using reasonable defaults
    summerStartDate: Date = new Date(2025, 5, 8), // June 8, 2025 (approximate)
    summerEndDate: Date = new Date(2025, 7, 8) // August 8, 2025 (approximate)
  ) {
    this.summerStartDate = summerStartDate;
    this.summerEndDate = summerEndDate;
  }

  /**
   * Generate all custody events for a date range
   */
  generateEvents(startDate: Date, endDate: Date): CustodyEvent[] {
    const events: CustodyEvent[] = [];

    // Generate all event types
    events.push(...this.generateRegularSchedule(startDate, endDate));
    events.push(...this.generateWeekendSchedule(startDate, endDate));
    events.push(...this.generateSummerSchedule(startDate, endDate));
    events.push(...this.generateHolidays(startDate, endDate));
    events.push(...this.generateWinterBreak(startDate, endDate));
    events.push(...this.generateSpecialEvents(startDate, endDate));

    // Resolve conflicts by priority
    return this.resolveConflicts(events);
  }

  /**
   * Generate regular school year schedule (Thursday nights)
   */
  private generateRegularSchedule(
    startDate: Date,
    endDate: Date
  ): CustodyEvent[] {
    const events: CustodyEvent[] = [];
    let currentDate = startOfDay(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = getDay(currentDate);

      // Thursday overnight with father (6pm Thursday to 8am Friday)
      if (dayOfWeek === 4) {
        // Thursday
        const thursdayStart = new Date(currentDate);
        thursdayStart.setHours(18, 0, 0, 0);
        const fridayEnd = new Date(currentDate);
        fridayEnd.setDate(fridayEnd.getDate() + 1);
        fridayEnd.setHours(8, 0, 0, 0);

        // Generate school-aware description
        const thursdaySchedule = thornhillSchedule.getScheduleForDate(currentDate);
        const fridaySchedule = thornhillSchedule.getScheduleForDate(fridayEnd);

        const pickupDesc = thursdaySchedule.isSchoolDay
          ? getPickupDropoffDescription(currentDate, true, '6:00 PM')
          : 'Pickup at 6:00 PM (non-school day)';

        const dropoffDesc = fridaySchedule.isSchoolDay
          ? getPickupDropoffDescription(fridayEnd, false, '8:00 AM')
          : 'Dropoff at 8:00 AM (non-school day)';

        events.push({
          id: `regular-thu-${format(currentDate, 'yyyy-MM-dd')}`,
          startDate: thursdayStart,
          endDate: fridayEnd,
          custodyType: 'regular',
          parent: 'father',
          title: 'Thursday Night',
          description: `${pickupDesc} → ${dropoffDesc}`,
          priority: 10,
        });
      }

      currentDate = addDays(currentDate, 1);
    }

    return events;
  }

  /**
   * Generate alternating weekend schedule
   * Alternates between mother and father every other weekend
   */
  private generateWeekendSchedule(
    startDate: Date,
    endDate: Date
  ): CustodyEvent[] {
    const events: CustodyEvent[] = [];

    // Reference date: January 3, 2025 starts father's weekend
    const referenceDate = new Date(2025, 0, 3); // Friday, Jan 3, 2025
    let currentWeekend = startOfWeek(startDate, { weekStartsOn: 5 }); // Start from Friday

    // Determine which parent's weekend by counting weeks from reference
    const weeksSinceReference = Math.floor(
      differenceInDays(currentWeekend, referenceDate) / 7
    );

    let isFatherWeekend = weeksSinceReference % 2 === 0;

    while (currentWeekend <= endDate) {
      const fridayStart = new Date(currentWeekend);
      fridayStart.setHours(18, 0, 0, 0); // 6pm Friday

      const sundayEnd = addDays(currentWeekend, 2); // Sunday
      sundayEnd.setHours(18, 0, 0, 0); // 6pm Sunday

      // Generate school-aware description
      const fridaySchedule = thornhillSchedule.getScheduleForDate(currentWeekend);
      const mondayAfter = addDays(sundayEnd, 1);
      const mondaySchedule = thornhillSchedule.getScheduleForDate(mondayAfter);

      const pickupDesc = fridaySchedule.isSchoolDay
        ? getPickupDropoffDescription(currentWeekend, true, '6:00 PM')
        : 'Pickup at 6:00 PM Friday (non-school day)';

      const dropoffDesc = mondaySchedule.isSchoolDay
        ? getPickupDropoffDescription(mondayAfter, false, '8:00 AM')
        : 'Dropoff at 6:00 PM Sunday';

      events.push({
        id: `weekend-${format(currentWeekend, 'yyyy-MM-dd')}`,
        startDate: fridayStart,
        endDate: sundayEnd,
        custodyType: 'weekend',
        parent: isFatherWeekend ? 'father' : 'mother',
        title: `${isFatherWeekend ? "Father's" : "Mother's"} Weekend`,
        description: `${pickupDesc} → ${dropoffDesc}`,
        priority: 20,
      });

      currentWeekend = addWeeks(currentWeekend, 2);
      isFatherWeekend = !isFatherWeekend;
    }

    return events;
  }

  /**
   * Generate summer 8-week rotation schedule
   * Week 1, 3, 5, 7: Father
   * Week 2, 4, 6, 8: Mother
   */
  private generateSummerSchedule(
    startDate: Date,
    endDate: Date
  ): CustodyEvent[] {
    const events: CustodyEvent[] = [];

    // Check if date range overlaps with summer
    const summerStart = this.summerStartDate;
    const summerEnd = this.summerEndDate;

    if (endDate < summerStart || startDate > summerEnd) {
      return events; // No overlap
    }

    let weekStart = summerStart;
    let weekNumber = 1;

    while (weekNumber <= 8) {
      const weekEnd = addDays(weekStart, 7);
      const isFatherWeek = weekNumber % 2 === 1; // Odd weeks: father

      // Only include if within requested date range
      if (weekEnd >= startDate && weekStart <= endDate) {
        events.push({
          id: `summer-week-${weekNumber}`,
          startDate: weekStart,
          endDate: weekEnd,
          custodyType: 'summer',
          parent: isFatherWeek ? 'father' : 'mother',
          title: `Summer Week ${weekNumber}`,
          description: `8-week summer rotation - ${
            isFatherWeek ? "Father's" : "Mother's"
          } week`,
          priority: 50,
        });
      }

      weekStart = weekEnd;
      weekNumber++;
    }

    return events;
  }

  /**
   * Generate holiday events based on year parity
   */
  private generateHolidays(startDate: Date, endDate: Date): CustodyEvent[] {
    const events: CustodyEvent[] = [];
    const startYear = getYear(startDate);
    const endYear = getYear(endDate);

    for (let year = startYear; year <= endYear; year++) {
      const isEvenYear = year % 2 === 0;

      for (const holiday of HOLIDAYS) {
        // Skip if wrong parity
        if (holiday.yearParity !== 'all') {
          if (
            (holiday.yearParity === 'even' && !isEvenYear) ||
            (holiday.yearParity === 'odd' && isEvenYear)
          ) {
            continue;
          }
        }

        // Calculate holiday date
        let holidayDate: Date;
        if (typeof holiday.dateRule === 'string') {
          holidayDate = parseHolidayDate(holiday.dateRule, year);
        } else {
          holidayDate = holiday.dateRule(year);
        }

        // Check if within range
        if (holidayDate >= startDate && holidayDate <= endDate) {
          // Most holidays are 3-day weekends (Friday 6pm to Monday 8am)
          let eventStart = new Date(holidayDate);
          let eventEnd = new Date(holidayDate);

          // Special handling for different holiday types
          if (holiday.name.includes('Christmas')) {
            // Christmas break is longer
            if (holiday.name.includes('First Half')) {
              eventStart.setHours(0, 0, 0, 0);
              eventEnd = new Date(year, 11, 26, 12, 0, 0, 0); // Until 12/26 noon
            } else {
              eventStart = new Date(year, 11, 26, 12, 0, 0, 0); // From 12/26 noon
              eventEnd = new Date(year + 1, 0, 2, 8, 0, 0, 0); // Until Jan 2 8am (approximate)
            }
          } else if (holiday.name === 'Spring Break') {
            // Spring break is full week
            eventStart.setHours(0, 0, 0, 0);
            eventEnd = addDays(eventStart, 7);
            eventEnd.setHours(8, 0, 0, 0);
          } else if (
            holiday.name === "Mother's Day" ||
            holiday.name === "Father's Day"
          ) {
            // Special days are just that day
            eventStart.setHours(0, 0, 0, 0);
            eventEnd.setHours(23, 59, 59, 999);
          } else {
            // Standard 3-day weekend
            const dayOfWeek = getDay(holidayDate);

            if (dayOfWeek === 1) {
              // Monday holiday - back up to Friday
              eventStart = addDays(holidayDate, -3); // Back to Friday
              eventStart.setHours(18, 0, 0, 0); // 6pm Friday
              eventEnd = addDays(holidayDate, 1); // Tuesday morning
              eventEnd.setHours(8, 0, 0, 0); // 8am Tuesday
            } else if (dayOfWeek === 4) {
              // Thursday holiday (Thanksgiving) - Thursday through Sunday
              eventStart.setHours(0, 0, 0, 0); // Thursday morning
              eventEnd = addDays(holidayDate, 4); // Monday morning
              eventEnd.setHours(8, 0, 0, 0); // 8am Monday
            } else {
              // Other days - just the day itself plus weekend
              eventStart.setHours(0, 0, 0, 0);
              eventEnd = addDays(eventStart, 3);
              eventEnd.setHours(8, 0, 0, 0);
            }
          }

          events.push({
            id: `holiday-${year}-${holiday.name.replace(/\s+/g, '-')}`,
            startDate: eventStart,
            endDate: eventEnd,
            custodyType: 'holiday',
            parent: holiday.parent,
            title: holiday.name,
            description: `Holiday custody - ${holiday.parent}'s ${holiday.yearParity} year`,
            priority: holiday.priority,
          });
        }
      }
    }

    return events;
  }

  /**
   * Generate Winter Break custody schedule
   * 2025: Specific court-ordered schedule
   * 2026+: Dynamic calculation based on school calendar with even/odd year split
   */
  private generateWinterBreak(
    startDate: Date,
    endDate: Date
  ): CustodyEvent[] {
    const events: CustodyEvent[] = [];
    const startYear = getYear(startDate);
    const endYear = getYear(endDate);

    // Special handling for 2025-2026 winter break (Dec 18, 2025 - Jan 6, 2026)
    const winterBreak2025Start = new Date(2025, 11, 18);
    const winterBreak2025End = new Date(2026, 0, 6);
    const overlaps2025WinterBreak = !(winterBreak2025End < startDate || winterBreak2025Start > endDate);

    if (overlaps2025WinterBreak) {
      // Generate the specific 2025-2026 5-period winter break schedule
        // 2025-2026 Winter Break: Specific court order schedule
        // Priority 200: Higher than birthdays (150) and other holidays (100)
        // to ensure the court-ordered schedule is followed exactly

        // Mother: Dec 18 school pickup → Dec 22 at 11am
        const dec18 = new Date(2025, 11, 18);
        const dec18Schedule = thornhillSchedule.getScheduleForDate(dec18);
        events.push({
          id: 'winter-break-2025-1',
          startDate: new Date(2025, 11, 18, 13, 30, 0), // Dec 18, 1:30pm (minimum day dismissal)
          endDate: new Date(2025, 11, 22, 11, 0, 0), // Dec 22, 11am
          custodyType: 'holiday',
          parent: 'mother',
          title: 'Winter Break 2025 - Period 1',
          description: `Pickup at ${thornhillSchedule.schoolName} after dismissal (Basil: ${dec18Schedule.dismissalTime.secondGrade}, Alfie: ${dec18Schedule.dismissalTime.kindergarten}) on Dec 18 - Minimum Day → Exchange at Father's home, curbside at 11:00 AM on Dec 22`,
          priority: 200,
        });

        // Father: Dec 22 at 11am → Dec 25 at 11am
        events.push({
          id: 'winter-break-2025-2',
          startDate: new Date(2025, 11, 22, 11, 0, 0), // Dec 22, 11am
          endDate: new Date(2025, 11, 25, 11, 0, 0), // Dec 25, 11am
          custodyType: 'holiday',
          parent: 'father',
          title: 'Winter Break 2025 - Period 2',
          description: 'Exchange at Father\'s home, curbside at 11:00 AM on Dec 22 → Exchange at Mother\'s home, curbside at 11:00 AM on Dec 25 (Christmas Day)',
          priority: 200,
        });

        // Mother: Dec 25 at 11am → Dec 29 at 11am
        events.push({
          id: 'winter-break-2025-3',
          startDate: new Date(2025, 11, 25, 11, 0, 0), // Dec 25, 11am
          endDate: new Date(2025, 11, 29, 11, 0, 0), // Dec 29, 11am
          custodyType: 'holiday',
          parent: 'mother',
          title: 'Winter Break 2025 - Period 3',
          description: 'Exchange at Mother\'s home, curbside at 11:00 AM on Dec 25 (Christmas Day) → Exchange at Father\'s home, curbside at 11:00 AM on Dec 29',
          priority: 200,
        });

        // Father: Dec 29 at 11am → Jan 2 at 11am
        events.push({
          id: 'winter-break-2025-4',
          startDate: new Date(2025, 11, 29, 11, 0, 0), // Dec 29, 11am
          endDate: new Date(2026, 0, 2, 11, 0, 0), // Jan 2, 11am
          custodyType: 'holiday',
          parent: 'father',
          title: 'Winter Break 2025 - Period 4',
          description: 'Exchange at Father\'s home, curbside at 11:00 AM on Dec 29 → Exchange at Mother\'s home, curbside at 11:00 AM on Jan 2 (includes Scott\'s birthday Dec 31)',
          priority: 200,
        });

        // Mother: Jan 2 at 11am → Jan 6 school dropoff (Jan 5 is PD day)
        const jan6 = new Date(2026, 0, 6);
        const jan6Schedule = thornhillSchedule.getScheduleForDate(jan6);
        events.push({
          id: 'winter-break-2025-5',
          startDate: new Date(2026, 0, 2, 11, 0, 0), // Jan 2, 11am
          endDate: new Date(2026, 0, 6, 8, 0, 0), // Jan 6, 8am (school dropoff - first day back)
          custodyType: 'holiday',
          parent: 'mother',
          title: 'Winter Break 2025 - Period 5',
          description: `Exchange at Mother's home, curbside at 11:00 AM on Jan 2 → Dropoff at ${thornhillSchedule.schoolName} for school start (Basil: ${jan6Schedule.dropoffTime.secondGrade}, Alfie: ${jan6Schedule.dropoffTime.kindergarten}) on Jan 6 (first day back - Jan 5 is PD day)`,
          priority: 200,
        });
    }

    // Generic winter break for other years (2026+, excluding 2025-2026 already handled)
    for (let year = startYear; year <= endYear; year++) {
      // Skip 2025 since we handle 2025-2026 specifically above
      if (year === 2025) continue;

      // Check if winter break dates fall within requested range
      const winterBreakStart = new Date(year, 11, 18); // Dec 18
      const winterBreakEnd = new Date(year + 1, 0, 5); // Jan 5 of next year

      // Skip if no overlap
      if (winterBreakEnd < startDate || winterBreakStart > endDate) {
        continue;
      }

      // 2026+ Winter Break: Dynamic calculation
      // TODO: Implement school calendar integration to get actual last day of school and first day back
      // For now, using reasonable approximations based on typical school calendars

      // Assume winter break is approximately Dec 20 through Jan 3
      // Last day of school before break (approximate)
      const lastDayOfSchool = new Date(year, 11, 20, 15, 0, 0); // Dec 20, 3pm
      // First day back at school (approximate)
      const firstDayBack = new Date(year + 1, 0, 3, 8, 0, 0); // Jan 3, 8am

      // Calculate midpoint for exchange
      const breakStart = lastDayOfSchool.getTime();
      const breakEnd = firstDayBack.getTime();
      const midpoint = new Date((breakStart + breakEnd) / 2);

      const isEvenYear = year % 2 === 0;

      // Even years: Mother gets first half, Father gets second half
      // Odd years: Father gets first half, Mother gets second half
      const firstHalfParent = isEvenYear ? 'mother' : 'father';
      const secondHalfParent = isEvenYear ? 'father' : 'mother';

      events.push({
        id: `winter-break-${year}-first`,
        startDate: lastDayOfSchool,
        endDate: midpoint,
        custodyType: 'holiday',
        parent: firstHalfParent,
        title: `Winter Break ${year} - First Half`,
        description: `Winter break ${isEvenYear ? 'even' : 'odd'} year - ${firstHalfParent} gets first half`,
        priority: 100,
      });

      events.push({
        id: `winter-break-${year}-second`,
        startDate: midpoint,
        endDate: firstDayBack,
        custodyType: 'holiday',
        parent: secondHalfParent,
        title: `Winter Break ${year} - Second Half`,
        description: `Winter break ${isEvenYear ? 'even' : 'odd'} year - ${secondHalfParent} gets second half`,
        priority: 100,
      });
    }

    return events;
  }

  /**
   * Generate special events (birthdays, etc.)
   */
  private generateSpecialEvents(
    startDate: Date,
    endDate: Date
  ): CustodyEvent[] {
    const events: CustodyEvent[] = [];
    const startYear = getYear(startDate);
    const endYear = getYear(endDate);

    // Mother's birthday (Alexandra - October 2)
    // Father's birthday (Scott - December 31)
    // Children's birthdays would go here

    for (let year = startYear; year <= endYear; year++) {
      const motherBirthday = new Date(year, 9, 2); // Oct 2 (Alexandra)
      const fatherBirthday = new Date(year, 11, 31); // Dec 31 (Scott)

      if (motherBirthday >= startDate && motherBirthday <= endDate) {
        events.push({
          id: `special-mother-bday-${year}`,
          startDate: startOfDay(motherBirthday),
          endDate: endOfDay(motherBirthday),
          custodyType: 'special',
          parent: 'mother',
          title: "Mother's Birthday",
          description: 'Special event - Mother has custody',
          priority: 150,
        });
      }

      if (fatherBirthday >= startDate && fatherBirthday <= endDate) {
        events.push({
          id: `special-father-bday-${year}`,
          startDate: startOfDay(fatherBirthday),
          endDate: endOfDay(fatherBirthday),
          custodyType: 'special',
          parent: 'father',
          title: "Father's Birthday",
          description: 'Special event - Father has custody',
          priority: 150,
        });
      }
    }

    return events;
  }

  /**
   * Resolve conflicts between events by priority
   * Higher priority events override lower priority ones
   */
  private resolveConflicts(events: CustodyEvent[]): CustodyEvent[] {
    // Sort by priority (highest first)
    const sortedEvents = [...events].sort((a, b) => b.priority - a.priority);

    const resolvedEvents: CustodyEvent[] = [];
    const occupiedIntervals: Array<{ start: Date; end: Date }> = [];

    for (const event of sortedEvents) {
      // Check if this event conflicts with any higher-priority event
      const hasConflict = occupiedIntervals.some((interval) =>
        this.intervalsOverlap(
          { start: event.startDate, end: event.endDate },
          interval
        )
      );

      if (!hasConflict) {
        resolvedEvents.push(event);
        occupiedIntervals.push({
          start: event.startDate,
          end: event.endDate,
        });
      }
    }

    // Sort by start date for display
    return resolvedEvents.sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );
  }

  private intervalsOverlap(
    interval1: { start: Date; end: Date },
    interval2: { start: Date; end: Date }
  ): boolean {
    return (
      interval1.start < interval2.end && interval1.end > interval2.start
    );
  }

  /**
   * Get custody parent for a specific date/time
   */
  getCustodyForDate(date: Date): {
    parent: 'mother' | 'father';
    event: CustodyEvent | null;
  } {
    // Generate events for a week around this date
    const weekStart = addDays(date, -7);
    const weekEnd = addDays(date, 7);
    const events = this.generateEvents(weekStart, weekEnd);

    // Find the highest priority event that contains this date
    const matchingEvent = events.find((event) =>
      isWithinInterval(date, { start: event.startDate, end: event.endDate })
    );

    if (matchingEvent) {
      return { parent: matchingEvent.parent, event: matchingEvent };
    }

    // Default custody is with mother during school year
    return { parent: 'mother', event: null };
  }
}
