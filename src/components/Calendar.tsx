"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  startOfMonth, endOfMonth, eachDayOfInterval, format,
  isBefore, isToday, addMonths, subMonths, getDay, startOfDay,
} from "date-fns";
import { supabase, type Availability } from "@/lib/supabase";

const ROW_HEIGHT = 56;

interface CalendarProps {
  availabilityData: Availability[];
  bookedDates: { date: string; hours: number[] }[];
}

interface HourSlot { hour: number; booked: boolean; }
interface BookingBlock { start: number; end: number; }

export function Calendar({ availabilityData, bookedDates }: CalendarProps) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<HourSlot[]>([]);
  const [bookingBlocks, setBookingBlocks] = useState<BookingBlock[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [startHour, setStartHour] = useState<number | null>(null);
  const [endHour, setEndHour] = useState<number | null>(null);

  const today = useMemo(() => startOfDay(new Date()), []);
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
      const blocks: BookingBlock[] = [];
      bk?.forEach((b) => {
        blocks.push({ start: b.start_hour, end: b.end_hour });
        for (let h = b.start_hour; h < b.end_hour; h++) booked.add(h);
      });
      const result: HourSlot[] = [];
      for (let h = s; h < e; h++) result.push({ hour: h, booked: booked.has(h) });
      setSlots(result);
      setBookingBlocks(blocks);
    } catch {
      setSlots([]);
      setBookingBlocks([]);
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
    const slot = slots.find((s) => s.hour === h);
    if (!slot || slot.booked) return;
    if (startHour === null) { setStartHour(h); setEndHour(h + 1); }
    else if (h < startHour) { setStartHour(h); }
    else {
      // Check all hours between start and h are open
      let ok = true;
      for (let i = startHour; i <= h; i++) {
        const s = slots.find((sl) => sl.hour === i);
        if (!s || s.booked) { ok = false; break; }
      }
      if (ok) setEndHour(h + 1);
      else { setStartHour(h); setEndHour(h + 1); }
    }
  };

  const duration = startHour !== null && endHour !== null ? endHour - startHour : 0;

  const fmtHour = (h: number) => {
    const ampm = h >= 12 ? "PM" : "AM";
    const d = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${d}:00 ${ampm}`;
  };
  const fmtHourShort = (h: number) => {
    const ampm = h >= 12 ? "p.m." : "a.m.";
    const d = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${d}:00 ${ampm}`;
  };

  const inRange = (h: number) => startHour !== null && endHour !== null && h >= startHour && h < endHour;

  // Generate timeline hours from slots or default 6am-10pm
  const timelineStart = slots.length > 0 ? slots[0].hour : 6;
  const timelineEnd = slots.length > 0 ? slots[slots.length - 1].hour + 1 : 23;
  const timelineHours = Array.from({ length: timelineEnd - timelineStart }, (_, i) => i + timelineStart);

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

      {/* Day Timeline View */}
      {selectedDate && (
        <div className="mt-4 bg-[#12121a] border border-[#2a2a3a] rounded-2xl overflow-hidden" style={{ animation: 'slideDown 0.3s ease-out' }}>
          {/* Header */}
          <div className="px-5 py-3 border-b border-[#2a2a3a]/60 flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-white">
                {format(new Date(selectedDate + "T12:00:00"), "EEEE, MMMM d")}
              </h4>
              <p className="text-[11px] text-[#6b6b80] mt-0.5">Click available times to select your hours</p>
            </div>
            <button onClick={() => setSelectedDate(null)} className="w-7 h-7 rounded-lg flex items-center justify-center text-[#6b6b80] hover:bg-[#1a1a25] hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {loadingSlots ? (
            <div className="flex justify-center py-16">
              <div className="h-6 w-6 rounded-full border-2 border-[#2a2a3a] border-t-amber-500 animate-spin" />
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[420px] scrollbar-thin">
              <div className="relative" style={{ height: `${timelineHours.length * ROW_HEIGHT}px` }}>
                {/* Hour rows with grid lines */}
                {timelineHours.map((h, idx) => {
                  const slot = slots.find((s) => s.hour === h);
                  const open = slot ? !slot.booked : false;
                  const selected = inRange(h);
                  return (
                    <div
                      key={h}
                      className="absolute w-full flex items-stretch"
                      style={{ top: `${idx * ROW_HEIGHT}px`, height: `${ROW_HEIGHT}px` }}
                    >
                      {/* Time label */}
                      <div className="w-[76px] flex-shrink-0 flex items-start justify-end pr-3 pt-0">
                        <span className="text-[11px] text-[#6b6b80] -translate-y-[7px] font-medium tabular-nums">{fmtHour(h)}</span>
                      </div>
                      {/* Timeline cell */}
                      <div className="flex-1 border-t border-[#2a2a3a]/40 relative">
                        {open && !selected && (
                          <button
                            onClick={() => handleHourClick(h)}
                            className="absolute inset-0 hover:bg-amber-500/[0.06] transition-colors cursor-pointer z-10"
                          />
                        )}
                        {selected && (
                          <button
                            onClick={() => handleHourClick(h)}
                            className="absolute inset-0 bg-amber-500/[0.12] cursor-pointer z-10"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Booking blocks overlay */}
                {bookingBlocks.map((block, idx) => {
                  const topOffset = (block.start - timelineHours[0]) * ROW_HEIGHT;
                  const height = (block.end - block.start) * ROW_HEIGHT;
                  if (topOffset < 0 || topOffset >= timelineHours.length * ROW_HEIGHT) return null;
                  return (
                    <div
                      key={idx}
                      className="absolute left-[76px] right-3 z-20 pointer-events-none"
                      style={{ top: `${topOffset + 1}px`, height: `${height - 2}px` }}
                    >
                      <div className="h-full bg-amber-500/[0.08] border-l-[3px] border-amber-500 rounded-r-lg px-3 py-2 flex flex-col justify-center">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-3 h-3 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          <span className="text-[11px] text-amber-300 font-medium">{fmtHourShort(block.start)}–{fmtHourShort(block.end)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Selected range overlay */}
                {startHour !== null && endHour !== null && (
                  <div
                    className="absolute left-[76px] right-3 z-15 pointer-events-none"
                    style={{
                      top: `${(startHour - timelineHours[0]) * ROW_HEIGHT + 1}px`,
                      height: `${(endHour - startHour) * ROW_HEIGHT - 2}px`,
                    }}
                  >
                    <div className="h-full bg-amber-500/[0.15] border-l-[3px] border-amber-400 rounded-r-lg px-3 py-2 flex flex-col justify-center">
                      <span className="text-[11px] text-amber-300 font-semibold">
                        {fmtHourShort(startHour)}–{fmtHourShort(endHour)} · {duration}h selected
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary + CTA */}
          <div className="px-5 py-3 border-t border-[#2a2a3a]/60">
            {duration > 0 ? (
              <p className="text-xs text-[#6b6b80] mb-2">
                {fmtHour(startHour!)} – {fmtHour(endHour!)} · <span className="text-white font-semibold">{duration}h · ${duration * 150}</span>
              </p>
            ) : (
              <p className="text-xs text-[#4a4a5a] mb-2">No time selected</p>
            )}
            <button
              disabled={duration === 0}
              onClick={() => router.push(`/book/${selectedDate}?start=${startHour}&end=${endHour}`)}
              className={`w-full py-3 rounded-full text-sm font-semibold transition-all duration-300
                ${duration > 0
                  ? "bg-amber-500 text-black hover:bg-amber-400 hover:scale-[1.03] hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.98] shadow-md shadow-amber-500/20"
                  : "bg-[#1a1a25] text-[#4a4a5a] cursor-not-allowed"
                }
              `}
            >
              Continue Booking →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
