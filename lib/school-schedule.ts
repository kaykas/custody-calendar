import { parse } from 'date-fns';

export interface SchoolDay {
  date: Date;
  isSchoolDay: boolean;
  isMinimumDay: boolean;
  dismissalTime: {
    kindergarten: string; // Alfie
    secondGrade: string;  // Basil
  };
  dropoffTime: {
    kindergarten: string;
    secondGrade: string;
  };
  specialNote?: string;
}

export interface SchoolSchedule {
  schoolName: string;
  address: string;
  phone: string;
  getScheduleForDate: (date: Date) => SchoolDay;
  getSpringBreakDates: (year: number) => { start: Date; end: Date } | null;
}

// Thornhill Elementary School Schedule 2025-26
const SCHOOL_INFO = {
  name: 'Thornhill Elementary School',
  address: '5880 Thornhill Drive, Oakland CA 94611',
  phone: '(510) 879-2157',
};

// Bell schedule times
const BELL_TIMES = {
  kindergarten: {
    regular: {
      start: '08:20 AM',
      end: '02:15 PM',
    },
    minimum: {
      start: '08:20 AM',
      end: '01:10 PM',
    },
  },
  secondGrade: {
    regular: {
      start: '08:35 AM',
      end: '02:50 PM',
    },
    minimum: {
      start: '08:35 AM',
      end: '01:25 PM',
    },
  },
};

// OUSD Calendar 2025-26: No school days
const NO_SCHOOL_DATES_2025_26 = [
  // Before school starts
  new Date(2025, 7, 1),  // Aug 1-10 (summer)
  new Date(2025, 7, 2),
  new Date(2025, 7, 3),
  new Date(2025, 7, 4),
  new Date(2025, 7, 5),
  new Date(2025, 7, 6),  // PD Day
  new Date(2025, 7, 7),  // Collaboration/Work Day
  new Date(2025, 7, 8),  // Teacher Work Day
  new Date(2025, 7, 9),
  new Date(2025, 7, 10),

  // School year holidays
  new Date(2025, 8, 1),   // Labor Day - Sept 1
  new Date(2025, 8, 19),  // PD Day - Sept 19
  new Date(2025, 9, 13),  // Indigenous Peoples' Day - Oct 13
  new Date(2025, 9, 31),  // Halloween (not a school holiday, but noting)
  new Date(2025, 10, 11), // Veterans Day - Nov 11

  // Thanksgiving Break: Nov 24-28
  new Date(2025, 10, 24),
  new Date(2025, 10, 25),
  new Date(2025, 10, 26),
  new Date(2025, 10, 27),
  new Date(2025, 10, 28),

  // Winter Break: Dec 22 - Jan 2
  new Date(2025, 11, 22),
  new Date(2025, 11, 23),
  new Date(2025, 11, 24),
  new Date(2025, 11, 25),
  new Date(2025, 11, 26),
  new Date(2025, 11, 27),
  new Date(2025, 11, 28),
  new Date(2025, 11, 29),
  new Date(2025, 11, 30),
  new Date(2025, 11, 31),
  new Date(2026, 0, 1),   // New Year's Day
  new Date(2026, 0, 2),

  // Spring semester holidays
  new Date(2026, 0, 5),   // PD Day - Jan 5
  new Date(2026, 0, 19),  // MLK Day - Jan 19
  new Date(2026, 1, 16),  // Presidents' Day - Feb 16
  new Date(2026, 3, 3),   // Cesar Chavez Day - Apr 3

  // Spring Break: Apr 6-10
  new Date(2026, 3, 6),
  new Date(2026, 3, 7),
  new Date(2026, 3, 8),
  new Date(2026, 3, 9),
  new Date(2026, 3, 10),

  new Date(2026, 4, 25),  // Memorial Day - May 25
  new Date(2026, 4, 29),  // Teacher Work Day - May 29
  new Date(2026, 5, 19),  // Juneteenth - Jun 19
];

// Minimum days: Every Wednesday + additional dates
const ADDITIONAL_MINIMUM_DAYS = [
  // November 10-14 (Mon-Fri week)
  new Date(2025, 10, 10),
  new Date(2025, 10, 12), // Wed already minimum
  new Date(2025, 10, 13),
  new Date(2025, 10, 14),

  // December 11-20 (week before winter break)
  new Date(2025, 11, 11),
  new Date(2025, 11, 15),
  new Date(2025, 11, 16),
  new Date(2025, 11, 18),
  new Date(2025, 11, 19),

  // March 9-13 (Mon-Fri week)
  new Date(2026, 2, 9),
  new Date(2026, 2, 10),
  new Date(2026, 2, 12), // Wed already minimum
  new Date(2026, 2, 13),

  // May 28 (Last day of school)
  new Date(2026, 4, 28),
];

function isNoSchoolDay(date: Date): boolean {
  return NO_SCHOOL_DATES_2025_26.some(
    (noSchoolDate) =>
      noSchoolDate.getFullYear() === date.getFullYear() &&
      noSchoolDate.getMonth() === date.getMonth() &&
      noSchoolDate.getDate() === date.getDate()
  );
}

function isMinimumDay(date: Date): boolean {
  // Every Wednesday is minimum day
  if (date.getDay() === 3) return true;

  // Check additional minimum days
  return ADDITIONAL_MINIMUM_DAYS.some(
    (minDay) =>
      minDay.getFullYear() === date.getFullYear() &&
      minDay.getMonth() === date.getMonth() &&
      minDay.getDate() === date.getDate()
  );
}

function getScheduleForDate(date: Date): SchoolDay {
  const noSchool = isNoSchoolDay(date);
  const minimumDay = !noSchool && isMinimumDay(date);

  if (noSchool) {
    return {
      date,
      isSchoolDay: false,
      isMinimumDay: false,
      dismissalTime: {
        kindergarten: 'No school',
        secondGrade: 'No school',
      },
      dropoffTime: {
        kindergarten: 'No school',
        secondGrade: 'No school',
      },
    };
  }

  const schedule = minimumDay ? 'minimum' : 'regular';

  return {
    date,
    isSchoolDay: true,
    isMinimumDay: minimumDay,
    dismissalTime: {
      kindergarten: BELL_TIMES.kindergarten[schedule].end,
      secondGrade: BELL_TIMES.secondGrade[schedule].end,
    },
    dropoffTime: {
      kindergarten: BELL_TIMES.kindergarten[schedule].start,
      secondGrade: BELL_TIMES.secondGrade[schedule].start,
    },
    specialNote: minimumDay ? 'Minimum Day' : undefined,
  };
}

// Get spring break dates for a given year
function getSpringBreakDates(year: number): { start: Date; end: Date } | null {
  // Spring Break dates are defined in the NO_SCHOOL_DAYS array
  // Look for consecutive non-school days in March-April that represent spring break

  // Known spring breaks:
  if (year === 2026) {
    // Spring Break 2026: April 6-10 (Mon-Fri)
    return {
      start: new Date(2026, 3, 6),  // April 6
      end: new Date(2026, 3, 10),   // April 10
    };
  }

  // For other years, detect spring break by finding consecutive no-school days in March/April
  // This is a heuristic: look for 5+ consecutive weekdays off in March-April
  const marchStart = new Date(year, 2, 1); // March 1
  const aprilEnd = new Date(year, 3, 30);  // April 30

  let consecutiveDaysOff = 0;
  let breakStart: Date | null = null;
  let breakEnd: Date | null = null;

  for (let d = new Date(marchStart); d <= aprilEnd; d.setDate(d.getDate() + 1)) {
    const schedule = getScheduleForDate(new Date(d));
    const dayOfWeek = d.getDay();

    // Only count weekdays (Mon-Fri)
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      if (!schedule.isSchoolDay) {
        if (consecutiveDaysOff === 0) {
          breakStart = new Date(d);
        }
        consecutiveDaysOff++;
        breakEnd = new Date(d);
      } else {
        // School day - reset counter
        if (consecutiveDaysOff >= 5) {
          // Found spring break (5+ consecutive weekdays off)
          return { start: breakStart!, end: breakEnd! };
        }
        consecutiveDaysOff = 0;
        breakStart = null;
        breakEnd = null;
      }
    }
  }

  // Check if we ended with a break
  if (consecutiveDaysOff >= 5 && breakStart && breakEnd) {
    return { start: breakStart, end: breakEnd };
  }

  return null; // No spring break found
}

export const thornhillSchedule: SchoolSchedule = {
  schoolName: SCHOOL_INFO.name,
  address: SCHOOL_INFO.address,
  phone: SCHOOL_INFO.phone,
  getScheduleForDate,
  getSpringBreakDates,
};

// Helper function to format pickup/dropoff description
export function getPickupDropoffDescription(
  date: Date,
  isPickup: boolean,
  time: string
): string {
  const schedule = getScheduleForDate(date);

  if (!schedule.isSchoolDay) {
    // Non-school day pickup/dropoff
    return isPickup
      ? `Pickup at ${time} (No school)`
      : `Dropoff at ${time} (No school)`;
  }

  if (isPickup) {
    // School pickup - use dismissal time
    const basil2ndGrade = schedule.dismissalTime.secondGrade;
    const alfieKindergarten = schedule.dismissalTime.kindergarten;

    return `Pickup at ${SCHOOL_INFO.name} after dismissal (Basil: ${basil2ndGrade}, Alfie: ${alfieKindergarten})${schedule.isMinimumDay ? ' - Minimum Day' : ''}`;
  } else {
    // School dropoff - use start time
    const basil2ndGrade = schedule.dropoffTime.secondGrade;
    const alfieKindergarten = schedule.dropoffTime.kindergarten;

    return `Dropoff at ${SCHOOL_INFO.name} for school start (Basil: ${basil2ndGrade}, Alfie: ${alfieKindergarten})${schedule.isMinimumDay ? ' - Minimum Day' : ''}`;
  }
}
