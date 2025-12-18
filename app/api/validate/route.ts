import { NextRequest, NextResponse } from 'next/server';
import { CustodyCalendarEngine } from '@/lib/calendar-engine';
import { parse } from 'date-fns';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalEvents: number;
    byType: Record<string, number>;
    byParent: Record<string, number>;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate: startParam, endDate: endParam } = body;

    if (!startParam || !endParam) {
      return NextResponse.json(
        { error: 'Start and end date are required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const startDate = parse(startParam, 'yyyy-MM-dd', new Date());
    const endDate = parse(endParam, 'yyyy-MM-dd', new Date());

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Generate events
    const engine = new CustodyCalendarEngine();
    const events = engine.generateEvents(startDate, endDate);

    // Validation checks
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for overlapping events with same priority
    const sortedEvents = [...events].sort(
      (a, b) => a.startDate.getTime() - b.startDate.getTime()
    );

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      for (let j = i + 1; j < sortedEvents.length; j++) {
        const event1 = sortedEvents[i];
        const event2 = sortedEvents[j];

        // Check for overlap
        if (
          event1.endDate > event2.startDate &&
          event1.startDate < event2.endDate
        ) {
          if (event1.priority === event2.priority) {
            errors.push(
              `Conflicting events with same priority: "${event1.title}" and "${event2.title}"`
            );
          } else {
            warnings.push(
              `Overlapping events (resolved by priority): "${event1.title}" (priority ${event1.priority}) and "${event2.title}" (priority ${event2.priority})`
            );
          }
        }
      }
    }

    // Calculate statistics
    const stats = {
      totalEvents: events.length,
      byType: events.reduce(
        (acc, event) => {
          acc[event.custodyType] = (acc[event.custodyType] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
      byParent: events.reduce(
        (acc, event) => {
          acc[event.parent] = (acc[event.parent] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };

    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
      stats,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error validating calendar:', error);
    return NextResponse.json(
      { error: 'Failed to validate calendar' },
      { status: 500 }
    );
  }
}
