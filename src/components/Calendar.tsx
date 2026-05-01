"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isBefore,
  isToday,
  addMonths,
  subMonths,
  isSameDay,
} from "date-fns";
import { supabase, type Availability } from "@/lib/supabase";

interface CalendarProps {
  availabilityData: Availability[];
  bookedDates: { date: string; hours: number[] }[];
}

export function Calendar({ availabilityData, bookedDates }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create set of available dates
  const availableDates = new Set(
    availabilityData
      .filter((a) => a.is_available)
      .map((a) => a.date)
  );

  // Create set of booked dates
  const bookedDateSet = new Set(bookedDates.map((b) => b.date));

  const isDateAvailable = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const isPast = isBefore(date, new Date(new Date().setHours(0, 0, 0, 0)));
    const isBooked = bookedDateSet.has(dateStr);
    const hasAvailability = availableDates.has(dateStr);

    return !isPast && !isBooked && hasAvailability;
  };

  const handleDateClick = (date: Date) => {
    if (isDateAvailable(date)) {
      const dateStr = format(date, "yyyy-MM-dd");
      router.push(`/book/${dateStr}`);
    }
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Get the day of week the month starts on (0-6, 0 = Sunday)
  const firstDayOfWeek = monthStart.getDay();
  const calendarDays = Array(firstDayOfWeek).fill(null).concat(days);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white hover:border-white/40 hover:bg-white/10"
        >
          ← Previous
        </button>
        <h2 className="text-2xl font-bold text-white">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={nextMonth}
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white hover:border-white/40 hover:bg-white/10"
        >
          Next →
        </button>
      </div>

      <div className="glass rounded-xl p-6">
        <div className="mb-4 grid grid-cols-7 gap-2 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="py-2 text-sm font-semibold text-gray-400">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date, idx) => {
            if (!date) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const available = isDateAvailable(date);
            const dateStr = format(date, "yyyy-MM-dd");
            const isPast = isBefore(date, new Date(new Date().setHours(0, 0, 0, 0)));
            const isCurrentDay = isToday(date);

            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(date)}
                disabled={!available}
                className={`group relative aspect-square rounded-lg border transition-all ${
                  available
                    ? "cursor-pointer border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/15"
                    : "cursor-not-allowed border-gray-700/50 bg-gray-900/30"
                }`}
                title={available ? "Click to book" : "Not available"}
              >
                <div className="flex h-full flex-col items-center justify-center">
                  <span
                    className={`text-sm font-semibold ${
                      available ? "text-amber-400" : "text-gray-600"
                    }`}
                  >
                    {format(date, "d")}
                  </span>
                  {isCurrentDay && (
                    <span className="mt-0.5 text-xs text-amber-400">today</span>
                  )}
                </div>

                {!available && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/20 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                    <span className="text-xs font-medium text-gray-400">
                      {isPast ? "Past" : "Not Available"}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="text-sm text-gray-300">Available</span>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-gray-700/30 bg-gray-900/30 p-4">
          <div className="h-3 w-3 rounded-full bg-gray-600" />
          <span className="text-sm text-gray-500">Not Available</span>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-gray-700/30 bg-gray-900/30 p-4">
          <div className="h-3 w-3 rounded-full bg-gray-600" />
          <span className="text-sm text-gray-500">Already Booked</span>
        </div>
      </div>
    </div>
  );
}
