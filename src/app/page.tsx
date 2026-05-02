"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Calendar } from "@/components/Calendar";
import type { Availability, Booking } from "@/lib/supabase";

export default function Home() {
  const [venueTitle, setVenueTitle] = useState("Barnscape Studios");
  const [availabilityData, setAvailabilityData] = useState<Availability[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { supabase } = await import("@/lib/supabase");

        const { data: spaces } = await supabase
          .from("spaces")
          .select("name")
          .eq("slug", "event-space")
          .single();

        if (spaces) {
          setVenueTitle(spaces.name);
        }

        const { data: availability } = await supabase
          .from("availability")
          .select("*");

        setAvailabilityData(availability || []);

        const { data: allBookings } = await supabase
          .from("bookings")
          .select("*")
          .in("status", ["pending", "confirmed"]);

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
    if (existing) {
      const newHours = [];
      for (let i = booking.start_hour; i < booking.end_hour; i++) {
        newHours.push(i);
      }
      existing.hours = [...new Set([...existing.hours, ...newHours])];
    } else {
      const hours = [];
      for (let i = booking.start_hour; i < booking.end_hour; i++) {
        hours.push(i);
      }
      acc.push({ date: booking.date, hours });
    }
    return acc;
  }, [] as { date: string; hours: number[] }[]);

  return (
    <>
      <Header title={venueTitle} />
      <main className="min-h-screen bg-[#0a0a0a] py-12">
        <div className="mx-auto max-w-6xl px-6">
          <section className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold md:text-5xl animate-fade-in">
              <span className="bg-gradient-to-r from-white via-amber-200 to-amber-400 bg-clip-text text-transparent">
                {venueTitle}
              </span>
            </h2>
            
            <p className="animate-slide-up mx-auto mb-8 max-w-2xl text-lg text-gray-400">
              A modern, sophisticated event space perfect for private events, corporate
              gatherings, and memorable celebrations. Select an available date below to
              begin your booking.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { title: "Available", desc: "Multiple dates open", delay: "0s" },
                { title: "Flexible", desc: "Book by the hour", delay: "0.1s" },
                { title: "Professional", desc: "Verified bookings", delay: "0.2s" },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="glass card-hover rounded-xl p-6 border border-amber-500/10"
                  style={{
                    animation: `slideUp 0.5s ease-out ${item.delay} both`,
                  }}
                >
                  <div className="text-3xl font-bold text-amber-400 mb-2 animate-pulse-glow">
                    {item.title}
                  </div>
                  <p className="text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-8 animate-slide-up">
              <h2 className="text-2xl font-bold text-white">Select a Date to Book</h2>
              <p className="mt-2 text-gray-400">
                Click on any available date to see available time slots and make your selection
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-amber-400" />
              </div>
            ) : (
              <Calendar availabilityData={availabilityData} bookedDates={bookedDates} />
            )}
          </section>

          <section className="mt-16 rounded-xl border border-gray-800/50 bg-gray-900/30 p-8 animate-slide-up">
            <h3 className="mb-4 text-xl font-semibold text-white">How It Works</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              {[
                { num: "1", title: "Select a Date", desc: "Browse the calendar and pick an available date" },
                { num: "2", title: "Choose Time", desc: "Pick your start and end times for the day" },
                { num: "3", title: "Add Details", desc: "Enter your contact information and preferences" },
                { num: "4", title: "Confirm", desc: "Send deposit via e-transfer and confirm booking" },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="card-hover group relative rounded-lg border border-amber-500/0 bg-amber-500/0 p-4 transition-all hover:border-amber-500/30 hover:bg-amber-500/10"
                  style={{
                    animation: `slideUp 0.5s ease-out ${0.1 * (idx + 1)}s both`,
                  }}
                >
                  <div className="mb-2 text-2xl font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                    {step.num}
                  </div>
                  <p className="text-gray-300">
                    <strong className="group-hover:text-amber-300 transition-colors">{step.title}</strong>
                    <br />
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
