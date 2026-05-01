"use client";

import { useMemo } from "react";
import type { Availability, Booking } from "@/lib/supabase";

interface TimeSlotPickerProps {
  date: string;
  availabilityData: Availability[];
  bookings: Booking[];
  minHours: number;
  hourlyRate: number;
  selectedStart: number | null;
  selectedEnd: number | null;
  onStartChange: (hour: number) => void;
  onEndChange: (hour: number) => void;
}

export function TimeSlotPicker({
  date,
  availabilityData,
  bookings,
  minHours,
  hourlyRate,
  selectedStart,
  selectedEnd,
  onStartChange,
  onEndChange,
}: TimeSlotPickerProps) {
  // Get availability window for this date
  const dateAvailability = availabilityData.find((a) => a.date === date);

  // Get booked hours for this date from all spaces
  const bookedHours = new Set(
    bookings
      .filter((b) => b.date === date)
      .flatMap((b) => {
        const hours = [];
        for (let i = b.start_hour; i < b.end_hour; i++) {
          hours.push(i);
        }
        return hours;
      })
  );

  const startHour = dateAvailability?.start_hour ?? 9;
  const endHour = dateAvailability?.end_hour ?? 22;
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const isHourAvailable = (hour: number) => !bookedHours.has(hour);

  const canSelect = (start: number, end: number) => {
    if (start >= end) return false;
    if (end - start < minHours) return false;
    for (let i = start; i < end; i++) {
      if (!isHourAvailable(i)) return false;
    }
    return true;
  };

  const duration = selectedStart !== null && selectedEnd !== null
    ? selectedEnd - selectedStart
    : 0;

  const totalPrice = duration * hourlyRate;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold text-white">Select Time Slot</h3>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
          {hours.map((hour) => {
            const isAvailable = isHourAvailable(hour);
            const isSelected =
              selectedStart !== null &&
              selectedEnd !== null &&
              hour >= selectedStart &&
              hour < selectedEnd;

            return (
              <button
                key={hour}
                onClick={() => {
                  // Toggle hour selection or set start
                  if (isSelected && selectedStart === hour) {
                    // Clicking start hour again resets
                    onStartChange(null as any);
                    onEndChange(null as any);
                  } else if (!selectedStart || hour < selectedStart) {
                    // New start
                    onStartChange(hour);
                    onEndChange(hour + 1);
                  } else if (hour >= selectedStart) {
                    // Extend end
                    onEndChange(hour + 1);
                  }
                }}
                disabled={!isAvailable && (selectedStart === null || hour < selectedStart || hour >= selectedEnd)}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isSelected
                    ? "border-amber-400/60 border-2 bg-amber-400/20 text-white"
                    : isAvailable
                      ? "border border-gray-600 bg-gray-800/30 text-gray-300 hover:border-gray-500 hover:bg-gray-800/50"
                      : "border border-gray-700 bg-gray-900/20 text-gray-600 cursor-not-allowed"
                }`}
              >
                {String(hour).padStart(2, "0")}:00
              </button>
            );
          })}
        </div>
        <p className="mt-4 text-sm text-gray-400">
          {dateAvailability
            ? `Available: ${String(startHour).padStart(2, "0")}:00 - ${String(endHour).padStart(2, "0")}:00`
            : "No availability set for this date"}
        </p>
      </div>

      {selectedStart !== null && selectedEnd !== null && (
        <div className="space-y-4 rounded-lg border border-amber-500/30 bg-amber-500/5 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Check-in</p>
              <p className="text-2xl font-bold text-amber-400">
                {String(selectedStart).padStart(2, "0")}:00
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Check-out</p>
              <p className="text-2xl font-bold text-amber-400">
                {String(selectedEnd).padStart(2, "0")}:00
              </p>
            </div>
          </div>

          <div className="border-t border-amber-500/20 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Duration</span>
              <span className="font-semibold text-white">{duration} hours</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-gray-400">Rate</span>
              <span className="font-semibold text-white">${hourlyRate}/hour</span>
            </div>
            {!dateAvailability?.is_available && (
              <p className="mt-3 rounded bg-red-900/30 p-2 text-sm text-red-300">
                Warning: This date has been marked unavailable
              </p>
            )}
          </div>

          <div className="border-t border-amber-500/20 pt-4">
            <div className="flex items-center justify-between text-lg font-bold">
              <span>Subtotal</span>
              <span className="text-amber-400">${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {selectedStart === null && (
        <p className="rounded-lg bg-gray-900/50 p-4 text-center text-sm text-gray-400">
          Click to select your start time and drag to select duration (minimum {minHours} hours)
        </p>
      )}
    </div>
  );
}
