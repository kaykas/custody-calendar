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
  const [hideFatherTime, setHideFatherTime] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventsForDay = (date: Date): CalendarEvent[] => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = new Date(event.endDate);

      // Check if event overlaps with this day:
      // Event starts before day ends AND event ends after day starts
      return eventStart <= dayEnd && eventEnd >= dayStart;
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

  const getCustodyDayClasses = (parent: Parent | null, custodyType?: string) => {
    if (!parent) return 'mother-custody-day'; // Default to mother

    // Mother's custody - prominent with custom classes
    if (parent === 'mother') {
      const motherClasses = {
        regular: 'mother-custody-day',
        weekend: 'mother-custody-weekend',
        summer: 'mother-custody-summer',
        holiday: 'mother-custody-holiday',
        special: 'mother-custody-special',
      };
      return custodyType ? motherClasses[custodyType as keyof typeof motherClasses] : 'mother-custody-day';
    }

    // Father's custody - de-emphasized with custom classes
    const fatherClasses = {
      regular: 'father-custody-day',
      weekend: 'father-custody-weekend',
      summer: 'father-custody-summer',
      holiday: 'father-custody-holiday',
      special: 'father-custody-special',
    };
    return custodyType ? fatherClasses[custodyType as keyof typeof fatherClasses] : 'father-custody-day';
  };

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--mother-special)' }}>
            Alexandra's Custody Calendar
          </h1>
          <p className="text-sm text-gray-600 mt-1">Your time with the children</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevMonth}
            className="px-4 py-2 rounded-lg smooth-transition"
            style={{
              background: 'var(--mother-lighter)',
              color: 'var(--mother-special)',
              border: '1px solid var(--mother-light)'
            }}
            aria-label="Previous month"
          >
            Previous
          </button>
          <button
            onClick={handleToday}
            className="px-4 py-2 text-white rounded-lg smooth-transition"
            style={{
              background: 'var(--mother-primary)',
              boxShadow: '0 2px 8px var(--shadow-soft)'
            }}
            aria-label="Go to today"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="px-4 py-2 rounded-lg smooth-transition"
            style={{
              background: 'var(--mother-lighter)',
              color: 'var(--mother-special)',
              border: '1px solid var(--mother-light)'
            }}
            aria-label="Next month"
          >
            Next
          </button>
        </div>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold" style={{ color: 'var(--mother-primary)' }}>
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
      </div>

      {/* Controls and Legend */}
      <div className="mb-6 p-5 warm-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--mother-special)' }}>
            Calendar Legend
          </h3>

          {/* Hide Father's Time Toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <span className="text-sm font-medium text-gray-700">Hide Father's Time</span>
            <div className="relative">
              <input
                type="checkbox"
                checked={hideFatherTime}
                onChange={(e) => setHideFatherTime(e.target.checked)}
                className="sr-only"
                aria-label="Toggle visibility of father's custody time"
              />
              <div
                className={`w-12 h-6 rounded-full transition-colors ${
                  hideFatherTime ? 'bg-[var(--mother-primary)]' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                    hideFatherTime ? 'translate-x-6' : 'translate-x-1'
                  } mt-0.5`}
                ></div>
              </div>
            </div>
          </label>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Mother's time - prominent */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded shadow-sm"
              style={{
                background: 'var(--mother-regular)',
                border: '2px solid var(--mother-light)'
              }}
            ></div>
            <span className="text-sm font-semibold" style={{ color: 'var(--mother-special)' }}>
              Your Regular Time
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded shadow-sm"
              style={{
                background: 'var(--mother-weekend)',
                border: '2px solid var(--mother-accent)'
              }}
            ></div>
            <span className="text-sm font-semibold" style={{ color: 'var(--mother-special)' }}>
              Your Weekend
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded shadow-sm"
              style={{
                background: 'var(--mother-summer)',
                border: '2px solid var(--mother-primary)'
              }}
            ></div>
            <span className="text-sm font-semibold" style={{ color: 'var(--mother-special)' }}>
              Your Summer
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded shadow-sm"
              style={{
                background: 'var(--mother-holiday)',
                border: '3px solid var(--warm-accent)'
              }}
            ></div>
            <span className="text-sm font-semibold" style={{ color: 'var(--mother-special)' }}>
              Your Holiday
            </span>
          </div>
          {/* Father's time - de-emphasized */}
          {!hideFatherTime && (
            <div className="flex items-center gap-2 opacity-70">
              <div
                className="w-7 h-7 rounded"
                style={{
                  background: 'var(--father-regular)',
                  border: '1px solid var(--father-border)'
                }}
              ></div>
              <span className="text-xs text-gray-500">Father's Time</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar grid */}
        <div className="lg:col-span-2">
          <div className="warm-card overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px" style={{ background: 'var(--mother-lighter)' }}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="p-3 text-center text-sm font-semibold"
                  style={{
                    background: 'var(--mother-light)',
                    color: 'var(--mother-special)'
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-px" style={{ background: 'var(--mother-lighter)' }}>
              {days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const primaryParent = getPrimaryParentForDay(day);
                const primaryEvent = dayEvents[0];
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isDayToday = isToday(day);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;

                // Skip rendering if hiding father's time and this is father's day
                if (hideFatherTime && primaryParent === 'father') {
                  return (
                    <div
                      key={day.toISOString()}
                      className="min-h-24 p-2"
                      style={{ background: 'var(--father-light)' }}
                      aria-label={`${format(day, 'd')} - Father's custody (hidden)`}
                    >
                      <div className="text-xs text-gray-400">{format(day, 'd')}</div>
                    </div>
                  );
                }

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      min-h-24 p-3 cursor-pointer rounded-sm
                      ${getCustodyDayClasses(primaryParent, primaryEvent?.custodyType)}
                      ${!isCurrentMonth ? 'opacity-40' : ''}
                      ${isSelected ? 'ring-3 ring-[var(--mother-primary)] ring-inset' : ''}
                      ${isDayToday ? 'ring-3 ring-[var(--warm-accent)] ring-inset today-indicator' : ''}
                    `}
                    role="button"
                    tabIndex={0}
                    aria-label={`${format(day, 'EEEE, MMMM d')} - ${primaryParent === 'mother' ? "Your custody" : "Father's custody"}`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedDate(day);
                      }
                    }}
                  >
                    <div className="flex flex-col h-full">
                      <div
                        className={`text-sm mb-1 ${
                          primaryParent === 'mother' ? 'font-bold text-gray-900' : 'font-normal'
                        }`}
                        style={{
                          color: primaryParent === 'mother'
                            ? (primaryEvent?.custodyType === 'summer' ||
                               primaryEvent?.custodyType === 'holiday' ||
                               primaryEvent?.custodyType === 'special' ? 'white' : 'var(--mother-special)')
                            : 'var(--father-text)'
                        }}
                      >
                        {format(day, 'd')}
                      </div>
                      {dayEvents.length > 0 && (
                        <div className="flex-1 overflow-hidden">
                          {dayEvents.slice(0, 2).map((event) => (
                            <div
                              key={event.id}
                              className={`truncate mb-1 ${
                                event.parent === 'mother' ? 'mother-event-text' : 'father-event-text'
                              }`}
                              style={{
                                fontSize: event.parent === 'mother' ? '0.8125rem' : '0.6875rem',
                                color: event.parent === 'mother'
                                  ? (event.custodyType === 'summer' ||
                                     event.custodyType === 'holiday' ||
                                     event.custodyType === 'special' ? 'white' : 'var(--mother-special)')
                                  : 'var(--father-text)'
                              }}
                            >
                              {event.parent === 'mother' ? event.title : 'Father\'s custody'}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div
                              className="text-xs"
                              style={{
                                color: primaryParent === 'mother' ? 'var(--mother-special)' : 'var(--father-text)'
                              }}
                            >
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
          <div className="warm-card p-5 sticky top-4">
            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--mother-special)' }}>
              {selectedDate
                ? format(selectedDate, 'EEEE, MMMM d, yyyy')
                : 'Select a date'}
            </h3>

            {selectedDayEvents.length > 0 ? (
              <div className="space-y-4">
                {selectedDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={event.parent === 'mother' ? 'mother-event-card' : 'father-event-card'}
                    role="article"
                    aria-label={`${event.parent === 'mother' ? 'Your' : "Father's"} custody event`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`font-semibold ${
                          event.parent === 'mother' ? 'text-base' : 'text-sm'
                        }`}
                        style={{
                          color: event.parent === 'mother' ? 'var(--mother-special)' : 'var(--father-text)'
                        }}
                      >
                        {event.parent === 'mother' ? event.title : 'Father\'s Custody'}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          event.parent === 'mother' ? 'font-medium' : 'font-normal'
                        }`}
                        style={{
                          background: event.parent === 'mother' ? 'var(--mother-accent)' : 'var(--father-border)',
                          color: event.parent === 'mother' ? 'white' : 'var(--father-text)'
                        }}
                      >
                        {event.parent === 'mother' ? 'Your Time' : 'Father'}
                      </span>
                    </div>

                    {/* Show detailed information only for mother's custody */}
                    {event.parent === 'mother' ? (
                      <div className="text-sm space-y-2" style={{ color: 'var(--mother-special)' }}>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold min-w-[60px]">Type:</span>
                          <span className="capitalize">{event.custodyType}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="font-semibold min-w-[60px]">Time:</span>
                          <span>
                            {format(new Date(event.startDate), 'h:mm a')} -{' '}
                            {format(new Date(event.endDate), 'h:mm a')}
                          </span>
                        </div>
                        {event.description && (
                          <div className="mt-3 p-3 rounded" style={{ background: 'var(--mother-lighter)' }}>
                            <p className="text-xs font-medium" style={{ color: 'var(--mother-primary)' }}>
                              {event.description}
                            </p>
                          </div>
                        )}
                        {/* Transition indicators for pickups/dropoffs */}
                        {(event.custodyType === 'weekend' || event.custodyType === 'holiday') && (
                          <div className="transition-indicator mt-3">
                            <p className="text-xs">
                              <strong>Pickup:</strong> {format(new Date(event.startDate), 'EEEE, h:mm a')}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      // Minimal information for father's custody
                      <div className="text-xs space-y-1" style={{ color: 'var(--father-text)' }}>
                        <div>
                          <span className="capitalize">{event.custodyType}</span> custody period
                        </div>
                        <div className="opacity-70">
                          {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : selectedDate ? (
              <div className="p-4 rounded-lg" style={{ background: 'var(--mother-lighter)', border: '2px dashed var(--mother-light)' }}>
                <p className="text-sm font-medium" style={{ color: 'var(--mother-primary)' }}>
                  No special custody arrangements for this day.
                </p>
                <p className="text-xs mt-2" style={{ color: 'var(--mother-special)' }}>
                  <strong>Default custody:</strong> This is your regular custody time.
                </p>
              </div>
            ) : (
              <div className="text-center p-6" style={{ color: 'var(--mother-primary)' }}>
                <svg
                  className="mx-auto mb-3 opacity-50"
                  width="48"
                  height="48"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <p className="text-sm">Click on a date to see your custody details.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
