"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Calendar } from "@/components/Calendar";
import { supabase, type Availability, type Booking } from "@/lib/supabase";

export default function Home() {
  const [venueTitle, setVenueTitle] = useState("Barnscape Studios");
  const [availabilityData, setAvailabilityData] = useState<Availability[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get space info for title
        const { data: spaces } = await supabase
          .from("spaces")
          .select("name")
          .eq("slug", "event-space")
          .single();

        if (spaces) {
          setVenueTitle(spaces.name);
        }

        // Get availability
        const { data: availability } = await supabase
          .from("availability")
          .select("*");

        setAvailabilityData(availability || []);

        // Get all bookings to check conflicts
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

  // Group bookings by date for calendar
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
          {/* Hero Section */}
          <section className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white md:text-5xl">
              {venueTitle}
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-400">
              A modern, sophisticated event space perfect for private events, corporate
              gatherings, and memorable celebrations. Select an available date below to
              begin your booking.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="glass rounded-xl p-6">
                <div className="text-3xl font-bold text-amber-400 mb-2">Available</div>
                <p className="text-gray-400">Multiple dates open</p>
              </div>
              <div className="glass rounded-xl p-6">
                <div className="text-3xl font-bold text-amber-400 mb-2">Flexible</div>
                <p className="text-gray-400">Book by the hour</p>
              </div>
              <div className="glass rounded-xl p-6">
                <div className="text-3xl font-bold text-amber-400 mb-2">Professional</div>
                <p className="text-gray-400">Verified bookings</p>
              </div>
            </div>
          </section>

          {/* Calendar Section */}
          <section>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">Select a Date to Book</h2>
              <p className="mt-2 text-gray-400">
                Click on any available date to see available time slots
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

          {/* Info Section */}
          <section className="mt-16 rounded-xl border border-gray-800/50 bg-gray-900/30 p-8">
            <h3 className="mb-4 text-xl font-semibold text-white">How It Works</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div>
                <div className="mb-2 text-2xl font-bold text-amber-400">1</div>
                <p className="text-gray-300">
                  <strong>Select a Date</strong>
                  <br />
                  Browse the calendar and pick an available date
                </p>
              </div>
              <div>
                <div className="mb-2 text-2xl font-bold text-amber-400">2</div>
                <p className="text-gray-300">
                  <strong>Choose Time</strong>
                  <br />
                  Pick your start and end times for the day
                </p>
              </div>
              <div>
                <div className="mb-2 text-2xl font-bold text-amber-400">3</div>
                <p className="text-gray-300">
                  <strong>Add Details</strong>
                  <br />
                  Enter your contact information and preferences
                </p>
              </div>
              <div>
                <div className="mb-2 text-2xl font-bold text-amber-400">4</div>
                <p className="text-gray-300">
                  <strong>Confirm</strong>
                  <br />
                  Send deposit via e-transfer and confirm booking
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
