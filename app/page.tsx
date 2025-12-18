'use client';

import { useEffect, useState } from 'react';
import CalendarView from '@/components/CalendarView';
import { CalendarEvent } from '@/lib/types';

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        // Fetch events for next 12 months
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1); // Include last month
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 12);

        const startParam = startDate.toISOString().split('T')[0];
        const endParam = endDate.toISOString().split('T')[0];

        const response = await fetch(
          `/api/calendar?start=${startParam}&end=${endParam}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch calendar events');
        }

        const data = await response.json();
        setEvents(data.events);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl font-semibold mb-2">Error loading calendar</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CalendarView events={events} />
    </div>
  );
}
