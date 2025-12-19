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
  const [filterParent, setFilterParent] = useState<'all' | 'mother' | 'father'>('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

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

  const handleGoogleCalendarSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      // Check if authenticated
      const statusResponse = await fetch('/api/sync/status');
      const statusData = await statusResponse.json();

      if (!statusData.authenticated) {
        // Redirect to Google OAuth
        window.location.href = '/api/auth/google';
        return;
      }

      // Perform sync
      const syncResponse = await fetch('/api/sync/google', { method: 'POST' });
      const syncData = await syncResponse.json();

      if (syncData.success) {
        setSyncMessage(`✓ Synced ${syncData.details.totalEvents} events to Google Calendar`);
        setTimeout(() => setSyncMessage(null), 5000);
      } else {
        setSyncMessage('✗ Sync failed. Please try again.');
        setTimeout(() => setSyncMessage(null), 5000);
      }
    } catch (error) {
      setSyncMessage('✗ Sync error. Please try again.');
      setTimeout(() => setSyncMessage(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header with navigation - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: 'var(--mother-special)' }}>
            Alexandra's Custody Calendar
          </h1>
          <p className="text-sm text-gray-600 mt-1">Your time with the children</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <button
            onClick={handleGoogleCalendarSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-lg smooth-transition font-medium flex items-center gap-2"
            style={{
              background: isSyncing ? 'var(--mother-light)' : 'var(--mother-accent)',
              color: 'white',
              border: '2px solid var(--mother-primary)',
              boxShadow: '0 2px 8px var(--shadow-soft)',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              opacity: isSyncing ? 0.6 : 1
            }}
            aria-label="Sync with Google Calendar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
            </svg>
            {isSyncing ? 'Syncing...' : 'Sync to Google Calendar'}
          </button>
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
        {syncMessage && (
          <div
            className="mt-2 p-2 rounded-lg text-sm font-medium"
            style={{
              background: syncMessage.startsWith('✓') ? '#d4edda' : '#f8d7da',
              color: syncMessage.startsWith('✓') ? '#155724' : '#721c24',
              border: `1px solid ${syncMessage.startsWith('✓') ? '#c3e6cb' : '#f5c6cb'}`
            }}
          >
            {syncMessage}
          </div>
        )}
      </div>

      {/* Controls and Legend */}
      <div className="mb-6 p-5 warm-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--mother-special)' }}>
            Calendar Legend
          </h3>

          {/* Neutral Parent Filter - Equal Treatment */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter by Parent:</span>
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: '#F3F4F6' }}>
              <button
                onClick={() => setFilterParent('all')}
                className={`px-3 py-1 text-sm rounded transition-all ${
                  filterParent === 'all' ? 'font-semibold shadow-sm' : 'opacity-60'
                }`}
                style={{
                  background: filterParent === 'all' ? 'white' : 'transparent',
                  color: filterParent === 'all' ? 'var(--foreground)' : 'var(--foreground)',
                }}
                aria-label="Show all custody time"
              >
                All
              </button>
              <button
                onClick={() => setFilterParent('mother')}
                className={`px-3 py-1 text-sm rounded transition-all ${
                  filterParent === 'mother' ? 'font-semibold shadow-sm' : 'opacity-60'
                }`}
                style={{
                  background: filterParent === 'mother' ? 'var(--mother-light)' : 'transparent',
                  color: filterParent === 'mother' ? 'var(--mother-special)' : 'var(--foreground)',
                }}
                aria-label="Show only mother's custody time"
              >
                Mother
              </button>
              <button
                onClick={() => setFilterParent('father')}
                className={`px-3 py-1 text-sm rounded transition-all ${
                  filterParent === 'father' ? 'font-semibold shadow-sm' : 'opacity-60'
                }`}
                style={{
                  background: filterParent === 'father' ? 'var(--father-light)' : 'transparent',
                  color: filterParent === 'father' ? 'var(--father-text)' : 'var(--foreground)',
                }}
                aria-label="Show only father's custody time"
              >
                Father
              </button>
            </div>
          </div>
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
          {/* Father's time - Equal Treatment */}
          {filterParent !== 'mother' && (
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded shadow-sm"
                style={{
                  background: 'var(--father-regular)',
                  border: '2px solid var(--father-light)'
                }}
              ></div>
              <span className="text-sm font-semibold" style={{ color: 'var(--father-text)' }}>
                Father's Time
              </span>
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

                // Apply parent filter - skip rendering if filtered out
                if (filterParent === 'mother' && primaryParent === 'father') {
                  return (
                    <div
                      key={day.toISOString()}
                      className="min-h-24 p-2"
                      style={{ background: 'var(--father-light)', opacity: 0.3 }}
                      aria-label={`${format(day, 'd')} - Father's custody (filtered)`}
                    >
                      <div className="text-xs text-gray-400">{format(day, 'd')}</div>
                    </div>
                  );
                }

                if (filterParent === 'father' && primaryParent === 'mother') {
                  return (
                    <div
                      key={day.toISOString()}
                      className="min-h-24 p-2"
                      style={{ background: 'var(--mother-light)', opacity: 0.3 }}
                      aria-label={`${format(day, 'd')} - Mother's custody (filtered)`}
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
                    style={{
                      minWidth: '44px',
                      minHeight: '44px',
                      touchAction: 'manipulation',
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${format(day, 'EEEE, MMMM d')} - ${primaryParent === 'mother' ? "Mother's custody" : "Father's custody"}`}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedDate(day);
                      }
                    }}
                  >
                    <div className="flex flex-col h-full">
                      <div
                        className="text-sm mb-1 font-bold"
                        style={{
                          color: primaryParent === 'mother'
                            ? (primaryEvent?.custodyType === 'summer' ||
                               primaryEvent?.custodyType === 'holiday' ||
                               primaryEvent?.custodyType === 'special' ? 'white' : 'var(--mother-special)')
                            : (primaryEvent?.custodyType === 'summer' ||
                               primaryEvent?.custodyType === 'holiday' ||
                               primaryEvent?.custodyType === 'special' ? 'white' : 'var(--father-text)')
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
                                fontSize: '0.8125rem',
                                color: event.parent === 'mother'
                                  ? (event.custodyType === 'summer' ||
                                     event.custodyType === 'holiday' ||
                                     event.custodyType === 'special' ? 'white' : 'var(--mother-special)')
                                  : (event.custodyType === 'summer' ||
                                     event.custodyType === 'holiday' ||
                                     event.custodyType === 'special' ? 'white' : 'var(--father-text)')
                              }}
                            >
                              {event.title}
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
                    aria-label={`${event.parent === 'mother' ? "Mother's" : "Father's"} custody event`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className="font-semibold text-base"
                        style={{
                          color: event.parent === 'mother' ? 'var(--mother-special)' : 'var(--father-text)'
                        }}
                      >
                        {event.title}
                      </span>
                      <span
                        className="text-xs px-2 py-1 rounded font-medium"
                        style={{
                          background: event.parent === 'mother' ? 'var(--mother-accent)' : 'var(--father-accent)',
                          color: 'white'
                        }}
                      >
                        {event.parent === 'mother' ? 'Mother' : 'Father'}
                      </span>
                    </div>

                    {/* Show detailed information for both parents - Equal Treatment */}
                    <div className="text-sm space-y-2" style={{ color: event.parent === 'mother' ? 'var(--mother-special)' : 'var(--father-text)' }}>
                      {event.courtOrderSection && (
                        <div className="flex items-start gap-2 mb-2">
                          <span
                            className="text-xs px-2 py-1 rounded font-semibold"
                            style={{
                              background: event.parent === 'mother' ? 'var(--mother-accent)' : 'var(--father-accent)',
                              color: 'white',
                              border: `2px solid ${event.parent === 'mother' ? 'var(--mother-primary)' : 'var(--father-primary)'}`,
                            }}
                          >
                            Court Order: {event.courtOrderSection}
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[60px]">Type:</span>
                        <span className="capitalize">{event.custodyType}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-semibold min-w-[60px]">Time:</span>
                        <span>
                          {format(new Date(event.startDate), 'MMM d, h:mm a')} -{' '}
                          {format(new Date(event.endDate), 'MMM d, h:mm a')}
                        </span>
                      </div>
                      {event.description && (
                        <div className="mt-3 p-3 rounded" style={{ background: event.parent === 'mother' ? 'var(--mother-lighter)' : 'var(--father-lighter)' }}>
                          <p className="text-xs font-medium" style={{ color: event.parent === 'mother' ? 'var(--mother-primary)' : 'var(--father-primary)' }}>
                            {event.description}
                          </p>
                        </div>
                      )}
                    </div>
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
