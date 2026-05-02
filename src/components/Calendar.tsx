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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [endHour, setEndHour] = useState<number | null>(null);
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

  // Get availability for selected date
  const getAvailabilityForDate = (dateStr: string) => {
    return availabilityData.find((a) => a.date === dateStr);
  };

  // Get booked hours for selected date
  const getBookedHours = (dateStr: string) => {
    const booked = bookedDates.find((b) => b.date === dateStr);
    return booked ? booked.hours : [];
  };

  const handleDateClick = (date: Date) => {
    if (isDateAvailable(date)) {
      const dateStr = format(date, "yyyy-MM-dd");
      setSelectedDate(dateStr);
      setStartHour(null);
      setEndHour(null);
    }
  };

  const handleHourClick = (hour: number) => {
    if (startHour === null) {
      setStartHour(hour);
    } else if (endHour === null) {
      if (hour > startHour) {
        setEndHour(hour);
      } else {
        // Reset if clicking before start hour
        setStartHour(hour);
        setEndHour(null);
      }
    } else {
      // Reset selection
      setStartHour(hour);
      setEndHour(null);
    }
  };

  const handleBooking = () => {
    if (selectedDate && startHour !== null && endHour !== null) {
      router.push(`/book/${selectedDate}?start=${startHour}&end=${endHour}`);
    }
  };

  const handleClearSelection = () => {
    setSelectedDate(null);
    setStartHour(null);
    setEndHour(null);
  };

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  // Get the day of week the month starts on (0-6, 0 = Sunday)
  const firstDayOfWeek = monthStart.getDay();
  const calendarDays = Array(firstDayOfWeek).fill(null).concat(days);

  // Get availability data for currently selected date
  const selectedAvailability = selectedDate
    ? getAvailabilityForDate(selectedDate)
    : null;
  const bookedHours = selectedDate ? getBookedHours(selectedDate) : [];

  const hours = selectedAvailability
    ? Array.from(
        { length: selectedAvailability.end_hour - selectedAvailability.start_hour },
        (_, i) => selectedAvailability.start_hour + i
      )
    : [];

  const isHourBooked = (hour: number) => bookedHours.includes(hour);
  const isHourSelected = (hour: number) => {
    if (startHour === null || endHour === null) return false;
    return hour >= startHour && hour < endHour;
  };

  const duration = startHour !== null && endHour !== null ? endHour - startHour : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white hover:border-white/40 hover:bg-white/10 transition-all hover:shadow-lg"
        >
          ← Previous
        </button>
        <h2 className="text-2xl font-bold text-white">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={nextMonth}
          className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white hover:border-white/40 hover:bg-white/10 transition-all hover:shadow-lg"
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
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => handleDateClick(date)}
                disabled={!available}
                className={`group relative aspect-square rounded-lg border transition-all ${
                  isSelected
                    ? "border-amber-500/80 bg-amber-500/20 ring-2 ring-amber-500/50 animate-pulse-glow"
                    : available
                    ? "cursor-pointer border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/15 hover:shadow-lg"
                    : "cursor-not-allowed border-gray-700/50 bg-gray-900/30"
                }`}
                title={available ? "Click to select date" : "Not available"}
              >
                <div className="flex h-full flex-col items-center justify-center">
                  <span
                    className={`text-sm font-semibold ${
                      isSelected
                        ? "text-amber-300"
                        : available
                        ? "text-amber-400"
                        : "text-gray-600"
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

      {/* Inline Hourly Slot Picker */}
      {selectedDate && selectedAvailability && (
        <div className="glass animate-slide-up rounded-xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">
                Select Time Slots for {format(new Date(selectedDate + "T00:00:00"), "MMMM d, yyyy")}
              </h3>
              <p className="mt-1 text-sm text-gray-400">
                Click a start hour, then click an end hour to select your booking time
              </p>
            </div>
            <button
              onClick={handleClearSelection}
              className="text-gray-400 hover:text-white transition-colors"
              title="Clear selection"
            >
              ✕
            </button>
          </div>

          {/* Hours Grid */}
          <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
            {hours.map((hour) => {
              const isBooked = isHourBooked(hour);
              const isSelected = isHourSelected(hour);
              const timeStr = `${hour.toString().padStart(2, "0")}:00`;
              const nextHourStr = `${(hour + 1).toString().padStart(2, "0")}:00`;

              return (
                <button
                  key={hour}
                  onClick={() => !isBooked && handleHourClick(hour)}
                  disabled={isBooked}
                  className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
                    isBooked
                      ? "cursor-not-allowed border-red-500/20 bg-red-500/5 opacity-60"
                      : isSelected
                      ? "border-amber-500/80 bg-amber-500/20 ring-2 ring-amber-500/50 animate-pulse-glow"
                      : "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60 hover:bg-amber-500/15 hover:shadow-lg hover:scale-[1.02]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <span className="font-semibold text-white">
                        {timeStr} - {nextHourStr}
                      </span>
                      {isBooked && (
                        <span className="ml-3 text-xs text-red-400 font-medium">
                          BOOKED
                        </span>
                      )}
                      {isSelected && (
                        <span className="ml-3 text-xs text-amber-300 font-medium">
                          SELECTED
                        </span>
                      )}
                    </div>
                    <div
                      className={`h-3 w-3 rounded-full transition-all ${
                        isBooked
                          ? "bg-red-500"
                          : isSelected
                          ? "bg-amber-400 ring-2 ring-amber-400/50"
                          : "bg-gray-600"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selection Summary and Booking Button */}
          {startHour !== null && endHour !== null && (
            <div className="animate-slide-up rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Selected Time</p>
                  <p className="mt-1 text-lg font-semibold text-amber-300">
                    {startHour.toString().padStart(2, "0")}:00 -{" "}
                    {endHour.toString().padStart(2, "0")}:00
                  </p>
                  <p className="mt-1 text-sm text-amber-400">
                    Duration: {duration} hour{duration !== 1 ? "s" : ""}
                  </p>
                </div>
                <button
                  onClick={handleBooking}
                  className="rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-semibold text-white hover:shadow-lg hover:shadow-amber-500/50 transition-all hover:scale-105 active:scale-95"
                >
                  Continue Booking →
                </button>
              </div>
            </div>
          )}

          {startHour === null && (
            <p className="text-center text-sm text-gray-500 py-4">
              Click an hour to start your selection
            </p>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <span className="text-sm text-gray-300">Available</span>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-gray-700/30 bg-gray-900/30 p-4">
          <div className="h-3 w-3 rounded-full bg-gray-600" />
          <span className="text-sm text-gray-500">Not Available</span>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-sm text-gray-400">Booked</span>
        </div>
      </div>
    </div>
  );
}
