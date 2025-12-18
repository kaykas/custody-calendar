'use client';

import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isSameDay,
  isToday,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from 'date-fns';
import { CalendarEvent, Parent } from '@/lib/types';

interface CalendarViewProps {
  events: CalendarEvent[];
}

export default function CalendarView({ events }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);
      return isWithinInterval(date, { start: eventStart, end: eventEnd });
    });
  };

  const getPrimaryParentForDay = (date: Date): Parent | null => {
    const dayEvents = getEventsForDay(date);
    if (dayEvents.length === 0) return 'mother'; // Default custody

    // Return highest priority event's parent
    const primaryEvent = dayEvents.reduce((prev, current) =>
      prev.priority > current.priority ? prev : current
    );
    return primaryEvent.parent;
  };

  const getCustodyTypeColor = (parent: Parent | null, custodyType?: string) => {
    if (!parent) return 'bg-gray-50';

    const baseColors = {
      mother: 'bg-blue-100 border-blue-300',
      father: 'bg-green-100 border-green-300',
    };

    const intensityColors = {
      regular: parent === 'mother' ? 'bg-blue-50' : 'bg-green-50',
      weekend: parent === 'mother' ? 'bg-blue-200' : 'bg-green-200',
      summer: parent === 'mother' ? 'bg-blue-300' : 'bg-green-300',
      holiday: parent === 'mother' ? 'bg-blue-400' : 'bg-green-400',
      special: parent === 'mother' ? 'bg-blue-500' : 'bg-green-500',
    };

    return custodyType ? intensityColors[custodyType as keyof typeof intensityColors] : baseColors[parent];
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Custody Calendar
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            Previous
          </button>
          <button
            onClick={handleToday}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
          >
            Next
          </button>
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
      </div>

      {/* Legend */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-3">Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 border-2 border-blue-300 rounded"></div>
            <span className="text-sm">Mother</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded"></div>
            <span className="text-sm">Father</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-200 border-2 border-blue-400 rounded"></div>
            <span className="text-sm">Weekend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-300 border-2 border-green-500 rounded"></div>
            <span className="text-sm">Summer</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-400 border-2 border-blue-600 rounded"></div>
            <span className="text-sm">Holiday</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="bg-gray-50 p-2 text-center text-sm font-semibold text-gray-700"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const primaryParent = getPrimaryParentForDay(day);
                const primaryEvent = dayEvents[0];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isDayToday = isToday(day);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      min-h-24 p-2 cursor-pointer transition-all
                      ${getCustodyTypeColor(primaryParent, primaryEvent?.custodyType)}
                      ${!isCurrentMonth ? 'opacity-40' : ''}
                      ${isSelected ? 'ring-2 ring-purple-500 ring-inset' : ''}
                      ${isDayToday ? 'ring-2 ring-yellow-500 ring-inset' : ''}
                      hover:opacity-80
                    `}
                  >
                    <div className="flex flex-col h-full">
                      <div className="text-sm font-semibold text-gray-900 mb-1">
                        {format(day, 'd')}
                      </div>
                      {dayEvents.length > 0 && (
                        <div className="flex-1 overflow-hidden">
                          {dayEvents.slice(0, 2).map((event, idx) => (
                            <div
                              key={event.id}
                              className="text-xs truncate mb-1 text-gray-700"
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div className="text-xs text-gray-600">
                              +{dayEvents.length - 2} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Event details sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-4 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">
              {selectedDate
                ? format(selectedDate, 'EEEE, MMMM d, yyyy')
                : 'Select a date'}
            </h3>

            {selectedDayEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`
                      p-3 rounded-lg border-2
                      ${event.parent === 'mother' ? 'bg-blue-50 border-blue-300' : 'bg-green-50 border-green-300'}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900">
                        {event.title}
                      </span>
                      <span
                        className={`
                          text-xs px-2 py-1 rounded
                          ${event.parent === 'mother' ? 'bg-blue-200' : 'bg-green-200'}
                        `}
                      >
                        {event.parent === 'mother' ? 'Mother' : 'Father'}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 space-y-1">
                      <div>
                        <strong>Type:</strong>{' '}
                        <span className="capitalize">{event.custodyType}</span>
                      </div>
                      <div>
                        <strong>Time:</strong>{' '}
                        {format(new Date(event.startDate), 'h:mm a')} -{' '}
                        {format(new Date(event.endDate), 'h:mm a')}
                      </div>
                      {event.description && (
                        <div className="mt-2 text-xs text-gray-500">
                          {event.description}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : selectedDate ? (
              <p className="text-gray-500">
                No special custody arrangements for this day.
                <br />
                <br />
                <strong>Default custody:</strong> Mother
              </p>
            ) : (
              <p className="text-gray-500">
                Click on a date to see custody details.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
