"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isBefore, isToday, addMonths, subMonths, getDay, startOfDay,
} from "date-fns";
import { supabase, type Availability } from "@/lib/supabase";

interface CalendarProps {
  availabilityData: Availability[];
  bookedDates: { date: string; hours: number[] }[];
}

interface HourSlot { hour: number; booked: boolean; }

export function Calendar({ availabilityData, bookedDates }: CalendarProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<HourSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [endHour, setEndHour] = useState<number | null>(null);

  const today = startOfDay(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const pad = getDay(startOfMonth(currentMonth));
  const availableDates = new Set(availabilityData.filter((a) => a.is_available).map((a) => a.date));

  const isAvailable = (date: Date) => {
    const ds = format(date, "yyyy-MM-dd");
    return !isBefore(date, today) && availableDates.has(ds);
  };

  const loadSlots = async (dateStr: string) => {
    setLoadingSlots(true);
    setStartHour(null);
    setEndHour(null);
    try {
      const [{ data: av }, { data: bk }] = await Promise.all([
        supabase.from("availability").select("start_hour, end_hour").eq("date", dateStr).single(),
        supabase.from("bookings").select("start_hour, end_hour").eq("date", dateStr).in("status", ["pending", "confirmed"]),
      ]);
      const s = av?.start_hour ?? 9;
      const e = av?.end_hour ?? 22;
      const booked = new Set<number>();
      bk?.forEach((b) => { for (let h = b.start_hour; h < b.end_hour; h++) booked.add(h); });
      const result: HourSlot[] = [];
      for (let h = s; h < e; h++) result.push({ hour: h, booked: booked.has(h) });
      setSlots(result);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateClick = (ds: string) => {
    if (selectedDate === ds) { setSelectedDate(null); return; }
    setSelectedDate(ds);
    loadSlots(ds);
  };

  const handleHourClick = (h: number) => {
    if (startHour === null) { setStartHour(h); setEndHour(h + 1); }
    else if (h < startHour) { setStartHour(h); }
    else { setEndHour(h + 1); }
  };

  const duration = startHour !== null && endHour !== null ? endHour - startHour : 0;

  const fmtHour = (h: number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const d = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${d}:00 ${ampm}`;
  };

  const inRange = (h: number) => startHour !== null && endHour !== null && h >= startHour && h < endHour;

  return (
    <div style={{ animation: 'slideUp 0.4s ease-out 0.1s both' }}>
      {/* Calendar card */}
      <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#2a2a3a]/60">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b6b80] hover:bg-[#1a1a25] hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h3 className="text-sm font-semibold text-white">{format(currentMonth, "MMMM yyyy")}</h3>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6b6b80] hover:bg-[#1a1a25] hover:text-white transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 px-3 pt-3">
          {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-[#4a4a5a] uppercase py-1">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1 px-3 pb-3">
          {Array.from({ length: pad }).map((_, i) => <div key={`p-${i}`} />)}
          {days.map((date) => {
            const ds = format(date, "yyyy-MM-dd");
            const avail = isAvailable(date);
            const sel = selectedDate === ds;
            const isT = isToday(date);
            return (
              <button
                key={ds}
                disabled={!avail}
                onClick={() => handleDateClick(ds)}
                className={`aspect-square rounded-xl text-xs font-medium flex items-center justify-center transition-all duration-150
                  ${avail
                    ? sel
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30 scale-105 font-bold"
                      : isT
                        ? "bg-amber-500/15 text-amber-300 ring-2 ring-amber-500 font-bold hover:bg-amber-500/25"
                        : "text-[#e4e4ed] hover:bg-[#1a1a25] cursor-pointer"
                    : "text-[#2a2a3a] cursor-default"
                  }
                `}
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="px-4 py-2.5 border-t border-[#2a2a3a]/60 flex gap-5 text-[10px] text-[#4a4a5a]">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#2a2a3a]" /> Unavailable</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500/20 ring-1 ring-amber-500" /> Today</span>
        </div>
      </div>

      {/* Hourly slots */}
      {selectedDate && (
        <div className="mt-4 bg-[#12121a] border border-[#2a2a3a] rounded-2xl overflow-hidden" style={{ animation: 'slideDown 0.3s ease-out' }}>
          <div className="px-5 py-3 border-b border-[#2a2a3a]/60 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">
                {format(new Date(selectedDate + "T12:00:00"), "EEEE, MMMM d")}
              </h4>
              <p className="text-[11px] text-[#6b6b80] mt-0.5">Tap hours to select your time</p>
            </div>
            <button onClick={() => setSelectedDate(null)} className="text-[#6b6b80] hover:text-white text-lg px-1">&times;</button>
          </div>

          {loadingSlots ? (
            <div className="flex justify-center py-10">
              <div className="h-5 w-5 rounded-full border-2 border-[#2a2a3a] border-t-amber-500 animate-spin" />
            </div>
          ) : (
            <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {slots.map((slot) => (
                <button
                  key={slot.hour}
                  disabled={slot.booked}
                  onClick={() => handleHourClick(slot.hour)}
                  className={`px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 text-center
                    ${slot.booked
                      ? "bg-[#1a1a25] text-[#2a2a3a] cursor-not-allowed line-through"
                      : inRange(slot.hour)
                        ? "bg-amber-500 text-black shadow-sm shadow-amber-500/20 font-semibold"
                        : "bg-[#0a0a0f] text-[#6b6b80] hover:bg-amber-500/10 hover:text-amber-400 cursor-pointer"
                    }
                  `}
                >
                  {fmtHour(slot.hour)}
                  {slot.booked && <span className="block text-[9px] mt-0.5" style={{ textDecoration: 'none' }}>Booked</span>}
                </button>
              ))}
            </div>
          )}

          <div className="px-5 py-3 border-t border-[#2a2a3a]/60">
            {duration > 0 ? (
              <p className="text-xs text-[#6b6b80] mb-2">
                {fmtHour(startHour!)} – {fmtHour(endHour!)} &middot; <span className="text-white font-semibold">{duration}h</span>
              </p>
            ) : (
              <p className="text-xs text-[#4a4a5a] mb-2">No time selected</p>
            )}
            <button
              disabled={duration === 0}
              onClick={() => router.push(`/book/${selectedDate}?start=${startHour}&end=${endHour}`)}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                ${duration > 0
                  ? "bg-amber-500 text-black hover:bg-amber-400 shadow-md shadow-amber-500/20"
                  : "bg-[#1a1a25] text-[#4a4a5a] cursor-not-allowed"
                }
              `}
            >
              Continue Booking &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
