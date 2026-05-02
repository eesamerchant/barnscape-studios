"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Calendar } from "@/components/Calendar";
import { supabase, type Availability, type Booking } from "@/lib/supabase";

export default function Home() {
  const [availabilityData, setAvailabilityData] = useState<Availability[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: availability }, { data: allBookings }] = await Promise.all([
          supabase.from("availability").select("*"),
          supabase.from("bookings").select("*").in("status", ["pending", "confirmed"]),
        ]);
        setAvailabilityData(availability || []);
        setBookings(allBookings || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const bookedDates = bookings.reduce((acc, booking) => {
    const existing = acc.find((b) => b.date === booking.date);
    const hours = [];
    for (let i = booking.start_hour; i < booking.end_hour; i++) hours.push(i);
    if (existing) {
      existing.hours = [...new Set([...existing.hours, ...hours])];
    } else {
      acc.push({ date: booking.date, hours });
    }
    return acc;
  }, [] as { date: string; hours: number[] }[]);

  return (
    <>
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-10" style={{ animation: 'slideUp 0.4s ease-out' }}>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Book Your <span className="text-amber-400">Event Space</span>
          </h2>
          <p className="text-[#8b949e] max-w-md mx-auto">
            A modern venue for private events, corporate gatherings, and celebrations. Pick a date below.
          </p>

          <div className="flex justify-center gap-3 mt-8">
            {[
              { label: '$150', sub: '/hr' },
              { label: '2hr', sub: 'min' },
              { label: 'E-Transfer', sub: 'payment' },
            ].map((item) => (
              <div key={item.label} className="bg-[#161b22] border border-[#30363d] rounded-2xl px-5 py-3 text-center hover:border-amber-500/30 transition-colors">
                <p className="text-lg font-bold text-amber-400">{item.label}</p>
                <p className="text-[11px] text-[#8b949e] uppercase tracking-wider">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-7 w-7 rounded-full border-2 border-[#30363d] border-t-amber-500 animate-spin" />
          </div>
        ) : (
          <Calendar availabilityData={availabilityData} bookedDates={bookedDates} />
        )}

        {/* How it works */}
        <div className="mt-12 bg-[#161b22] border border-[#30363d] rounded-2xl p-6" style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
          <h3 className="text-sm font-semibold text-white mb-4">How It Works</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { n: '1', t: 'Pick Date', d: 'Choose available date' },
              { n: '2', t: 'Select Hours', d: 'Tap time slots' },
              { n: '3', t: 'Add Details', d: 'Contact & add-ons' },
              { n: '4', t: 'Confirm', d: 'Send e-transfer' },
            ].map((s) => (
              <div key={s.n} className="text-center group">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 text-sm font-bold flex items-center justify-center mx-auto mb-2 group-hover:bg-amber-500 group-hover:text-black transition-colors">
                  {s.n}
                </div>
                <p className="text-xs font-medium text-white">{s.t}</p>
                <p className="text-[11px] text-[#8b949e] mt-0.5">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
