import { NextRequest, NextResponse } from 'next/server';
import { CustodyCalendarEngine } from '@/lib/calendar-engine';
import { parse } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');

    if (!startParam || !endParam) {
      return NextResponse.json(
        { error: 'Start and end date parameters are required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Parse dates
    const startDate = parse(startParam, 'yyyy-MM-dd', new Date());
    const endDate = parse(endParam, 'yyyy-MM-dd', new Date());

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Generate calendar events
    const engine = new CustodyCalendarEngine();
    const events = engine.generateEvents(startDate, endDate);

    // Convert to JSON-serializable format
    const serializedEvents = events.map((event) => ({
      id: event.id,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      custodyType: event.custodyType,
      parent: event.parent,
      title: event.title,
      description: event.description,
      priority: event.priority,
    }));

    return NextResponse.json({
      events: serializedEvents,
      count: serializedEvents.length,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error generating calendar:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar events' },
      { status: 500 }
    );
  }
}
