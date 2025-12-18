export type CustodyType = 'regular' | 'weekend' | 'summer' | 'holiday' | 'special';
export type Parent = 'mother' | 'father';

export interface CalendarEvent {
  id: string;
  startDate: string;
  endDate: string;
  custodyType: CustodyType;
  parent: Parent;
  title: string;
  description?: string;
  priority: number;
}

export interface DayInfo {
  date: Date;
  parent: Parent | null;
  events: CalendarEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
}
