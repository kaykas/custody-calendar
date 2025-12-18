import { NextRequest, NextResponse } from 'next/server';
import { CustodyCalendarEngine } from '@/lib/calendar-engine';
import { parse, addMonths, subMonths } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;

    // Generate events for a wide range to find the specific event
    const now = new Date();
    const startDate = subMonths(now, 12);
    const endDate = addMonths(now, 12);

    const engine = new CustodyCalendarEngine();
    const events = engine.generateEvents(startDate, endDate);

    // Find the event by ID
    const event = events.find((e) => e.id === eventId);

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Serialize the event
    const serializedEvent = {
      id: event.id,
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString(),
      custodyType: event.custodyType,
      parent: event.parent,
      title: event.title,
      description: event.description,
      priority: event.priority,
    };

    return NextResponse.json({ event: serializedEvent });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}
