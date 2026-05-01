"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { format, parse } from "date-fns";
import { Header } from "@/components/Header";
import { supabase, type Booking, type BookingAddOn, type AddOn, type Space } from "@/lib/supabase";

interface BookingWithDetails extends Booking {
  space?: Space;
  add_ons?: (BookingAddOn & { add_on?: AddOn })[];
}

export default function BookingConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [space, setSpace] = useState<Space | null>(null);
  const [addOns, setAddOns] = useState<(BookingAddOn & { add_on?: AddOn })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        // Get booking
        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .select("*")
          .eq("id", bookingId)
          .single();

        if (bookingError || !bookingData) {
          router.push("/");
          return;
        }

        setBooking(bookingData);

        // Get space details
        const { data: spaceData } = await supabase
          .from("spaces")
          .select("*")
          .eq("id", bookingData.space_id)
          .single();

        if (spaceData) {
          setSpace(spaceData);
        }

        // Get add-ons for this booking
        const { data: bookingAddOnsData } = await supabase
          .from("booking_add_ons")
          .select(`
            *,
            add_ons:add_on_id (*)
          `)
          .eq("booking_id", bookingId);

        if (bookingAddOnsData) {
          setAddOns(bookingAddOnsData as any);
        }
      } catch (error) {
        console.error("Error fetching booking:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, router]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0a0a0a] py-12">
          <div className="mx-auto max-w-4xl px-6 flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-amber-400" />
          </div>
        </main>
      </>
    );
  }

  if (!booking || !space) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0a0a0a] py-12">
          <div className="mx-auto max-w-4xl px-6">
            <div className="rounded-lg border border-red-500/30 bg-red-900/10 p-6 text-center">
              <p className="text-red-400">Booking not found.</p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-6 py-2 text-amber-400 hover:bg-amber-500/20"
              >
                Return to Home
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const statusColors = {
    pending: "bg-yellow-900/20 border-yellow-500/30 text-yellow-300",
    confirmed: "bg-green-900/20 border-green-500/30 text-green-300",
    cancelled: "bg-red-900/20 border-red-500/30 text-red-300",
    completed: "bg-blue-900/20 border-blue-500/30 text-blue-300",
  };

  const bookingDate = format(parse(booking.date, "yyyy-MM-dd", new Date()), "EEEE, MMMM d, yyyy");

  return (
    <>
      <Header title={space.name} />
      <main className="min-h-screen bg-[#0a0a0a] py-12">
        <div className="mx-auto max-w-4xl px-6">
          <button
            onClick={() => router.push("/")}
            className="mb-8 text-amber-400 hover:text-amber-300"
          >
            ← Back to Calendar
          </button>

          {/* Confirmation Message */}
          <div className="mb-8 rounded-xl border border-green-500/30 bg-green-900/10 p-8 text-center">
            <div className="mb-4 text-5xl">✓</div>
            <h1 className="mb-2 text-3xl font-bold text-white">Booking Confirmed!</h1>
            <p className="text-gray-400">
              Your booking request has been received. Details are below.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Booking Reference */}
              <div className="glass rounded-xl p-6 border border-gray-700/50">
                <h2 className="mb-4 text-lg font-semibold text-white">Booking Reference</h2>
                <div className="space-y-2">
                  <p className="text-4xl font-bold text-amber-400 font-mono">
                    {booking.id.substring(0, 8).toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Please save this reference for your records
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="glass rounded-xl p-6 border border-gray-700/50">
                <h2 className="mb-4 text-lg font-semibold text-white">Booking Status</h2>
                <div className={`inline-flex rounded-lg border px-4 py-2 ${statusColors[booking.status]}`}>
                  <span className="font-semibold capitalize">{booking.status}</span>
                </div>
                <p className="mt-4 text-sm text-gray-400">
                  {booking.status === "pending" &&
                    "Your booking is pending payment verification. Once we confirm your e-transfer, your booking will be marked as confirmed."}
                  {booking.status === "confirmed" &&
                    "Your booking has been confirmed! We look forward to hosting your event."}
                  {booking.status === "completed" &&
                    "Thank you for using our space! We hope you had a great experience."}
                  {booking.status === "cancelled" &&
                    "This booking has been cancelled."}
                </p>
              </div>

              {/* Booking Details */}
              <div className="glass rounded-xl p-6 border border-gray-700/50">
                <h2 className="mb-6 text-lg font-semibold text-white">Booking Details</h2>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-gray-700/30 pb-4">
                    <span className="text-gray-400">Space</span>
                    <span className="font-semibold text-white">{space.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700/30 pb-4">
                    <span className="text-gray-400">Date</span>
                    <span className="font-semibold text-white">{bookingDate}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700/30 pb-4">
                    <span className="text-gray-400">Time</span>
                    <span className="font-semibold text-white">
                      {String(booking.start_hour).padStart(2, "0")}:00 -{" "}
                      {String(booking.end_hour).padStart(2, "0")}:00
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700/30 pb-4">
                    <span className="text-gray-400">Duration</span>
                    <span className="font-semibold text-white">
                      {booking.end_hour - booking.start_hour} hours
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="glass rounded-xl p-6 border border-gray-700/50">
                <h2 className="mb-6 text-lg font-semibold text-white">Your Information</h2>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-gray-700/30 pb-4">
                    <span className="text-gray-400">Name</span>
                    <span className="font-semibold text-white">{booking.customer_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-700/30 pb-4">
                    <span className="text-gray-400">Email</span>
                    <span className="font-semibold text-white">{booking.customer_email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Phone</span>
                    <span className="font-semibold text-white">{booking.customer_phone}</span>
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              {addOns.length > 0 && (
                <div className="glass rounded-xl p-6 border border-gray-700/50">
                  <h2 className="mb-4 text-lg font-semibold text-white">Add-Ons</h2>
                  <div className="space-y-3">
                    {addOns.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between border-b border-gray-700/30 pb-3"
                      >
                        <div>
                          <p className="font-medium text-white">
                            {item.add_on?.name || "Unknown"} x{item.quantity}
                          </p>
                          {item.add_on?.description && (
                            <p className="text-sm text-gray-400">{item.add_on.description}</p>
                          )}
                        </div>
                        <span className="font-semibold text-white">
                          ${item.price_at_booking.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {booking.notes && (
                <div className="glass rounded-xl p-6 border border-gray-700/50">
                  <h2 className="mb-4 text-lg font-semibold text-white">Additional Notes</h2>
                  <p className="text-gray-300">{booking.notes}</p>
                </div>
              )}
            </div>

            {/* Pricing Summary */}
            <div>
              <div className="sticky top-20 rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white">Price Summary</h3>

                <div className="space-y-2 border-b border-amber-500/20 pb-4">
                  <div className="flex justify-between text-gray-400">
                    <span>Base Rate</span>
                    <span>${(booking.total_amount - booking.discount_amount).toFixed(2)}</span>
                  </div>
                </div>

                {booking.discount_amount > 0 && (
                  <div className="space-y-2 border-b border-amber-500/20 pb-4">
                    <div className="flex justify-between text-green-400">
                      <span>Discount</span>
                      <span>-${booking.discount_amount.toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 border-b border-amber-500/20 pb-4">
                  <div className="flex justify-between font-semibold text-white">
                    <span>Total</span>
                    <span className="text-amber-400">${booking.total_amount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-300">Deposit Due</span>
                    <span className="font-bold text-amber-400">
                      ${booking.deposit_amount.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    E-Transfer Reference: {booking.etransfer_reference}
                  </p>
                </div>

                <div className="border-t border-amber-500/20 pt-4 mt-4">
                  <p className="text-sm text-gray-300 mb-3">
                    <strong>Next Steps:</strong>
                  </p>
                  <ol className="text-xs text-gray-400 space-y-2">
                    <li>1. Send e-transfer of ${booking.deposit_amount.toFixed(2)}</li>
                    <li>2. Include your booking reference in the message</li>
                    <li>3. We'll confirm receipt and activate your booking</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-12 rounded-xl border border-blue-500/30 bg-blue-900/10 p-6">
            <h3 className="mb-2 text-lg font-semibold text-blue-300">Questions?</h3>
            <p className="text-blue-200">
              If you have any questions about your booking or need to make changes, please contact us.
              We're here to help make your event successful!
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
