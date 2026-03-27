import React from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface MeetingCalendarProps {
  meetings: any[];
}

export const MeetingCalendar: React.FC<MeetingCalendarProps> = ({ meetings }) => {
  // ✅ Convert Laravel date strings to JS Date objects
  // ✅ Include status so eventPropGetter can style accordingly
  const events = meetings.map((m) => ({
    id:       m.id,
    title:    m.title,
    start:    new Date(m.start_time),
    end:      new Date(m.end_time),
    allDay:   false,
    status:   m.status, // 'pending' | 'accepted' | 'rejected'
    resource: m,
  }));

  // ✅ Style each event based on its meeting status
  const eventPropGetter = (event: any) => {
    switch (event.status) {
      case 'accepted':
        return {
          className: '!bg-indigo-600 !text-white !rounded-md !border-none !px-2',
        };
      case 'rejected':
        return {
          className: '!bg-red-100 !text-red-700 !rounded-md !border !border-red-300 !px-2 !opacity-70',
        };
      case 'pending':
      default:
        return {
          className: '!bg-gray-200 !text-gray-600 !rounded-md !border-2 !border-dashed !border-gray-400 !px-2 !opacity-80',
        };
    }
  };

  return (
    <div className="h-[600px] bg-white p-6 rounded-xl shadow-sm border border-gray-100">

      {/* Header + Legend */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Your Schedule</h2>

        {/* ✅ Color legend so users understand the status colors */}
        <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-600 inline-block" />
            Accepted
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-300 border-2 border-dashed border-gray-400 inline-block" />
            Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-200 border border-red-300 inline-block" />
            Rejected
          </span>
        </div>
      </div>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        views={['month', 'week', 'day']}
        eventPropGetter={eventPropGetter}
      />
    </div>
  );
};
