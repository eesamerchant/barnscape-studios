"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { format, parse } from "date-fns";
import { Header } from "@/components/Header";
import { TimeSlotPicker } from "@/components/TimeSlotPicker";
import { BookingForm } from "@/components/BookingForm";
import {
  supabase,
  type Availability,
  type Booking,
  type AddOn,
  type Space,
} from "@/lib/supabase";

export default function BookingPage() {
  const router = useRouter();
  const params = useParams();
  const dateParam = params.date as string;

  const [space, setSpace] = useState<Space | null>(null);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [addOns, setAddOns] = useState<AddOn[]>([]);
  const [depositPercentage, setDepositPercentage] = useState(30);

  const [selectedStart, setSelectedStart] = useState<number | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get space info
        const { data: spaceData } = await supabase
          .from("spaces")
          .select("*")
          .eq("slug", "event-space")
          .single();

        if (!spaceData) {
          router.push("/");
          return;
        }

        setSpace(spaceData);

        // Get availability for this date
        const { data: avail } = await supabase
          .from("availability")
          .select("*")
          .eq("date", dateParam)
          .single();

        if (!avail || !avail.is_available) {
          router.push("/");
          return;
        }

        setAvailability(avail);

        // Get all bookings for this date
        const { data: bookingsData } = await supabase
          .from("bookings")
          .select("*")
          .eq("date", dateParam)
          .in("status", ["pending", "confirmed"]);

        setBookings(bookingsData || []);

        // Get add-ons for this space
        const { data: addOnsData } = await supabase
          .from("add_ons")
          .select("*")
          .eq("is_active", true)
          .or(`space_id.eq.${spaceData.id},space_id.is.null`);

        setAddOns(addOnsData || []);

        // Get deposit percentage from settings
        const { data: settingsData } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "deposit_percentage")
          .single();

        if (settingsData?.value?.deposit_percentage) {
          setDepositPercentage(settingsData.value.deposit_percentage);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateParam, router]);

  const handleSubmit = async (bookingData: any) => {
    if (!space) return;

    setSubmitting(true);

    try {
      // Create booking
      const { data: newBooking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          space_id: space.id,
          date: dateParam,
          start_hour: bookingData.start_hour,
          end_hour: bookingData.end_hour,
          customer_name: bookingData.customer_name,
          customer_email: bookingData.customer_email,
          customer_phone: bookingData.customer_phone,
          etransfer_reference: bookingData.etransfer_reference,
          total_amount: bookingData.total_amount,
          deposit_amount: bookingData.deposit_amount,
          discount_code_id: bookingData.discount_code_id,
          discount_amount: bookingData.discount_amount,
          status: "pending",
          payment_verified: false,
          notes: bookingData.notes,
        })
        .select()
        .single();

      if (bookingError) {
        alert("Error creating booking. Please try again.");
        return;
      }

      // Add booking add-ons
      if (bookingData.add_ons.length > 0) {
        const addOnRecords = bookingData.add_ons.map(
          (item: { add_on_id: string; quantity: number }) => {
            const addOn = addOns.find((a) => a.id === item.add_on_id);
            return {
              booking_id: newBooking.id,
              add_on_id: item.add_on_id,
              quantity: item.quantity,
              price_at_booking: addOn ? addOn.price * item.quantity : 0,
            };
          }
        );

        const { error: addOnError } = await supabase
          .from("booking_add_ons")
          .insert(addOnRecords);

        if (addOnError) {
          console.error("Error adding add-ons:", addOnError);
        }
      }

      // Update discount code usage
      if (bookingData.discount_code_id) {
        const { data: discountData } = await supabase
          .from("discount_codes")
          .select("current_uses")
          .eq("id", bookingData.discount_code_id)
          .single();

        const newUses = (discountData?.current_uses ?? 0) + 1;
        await supabase
          .from("discount_codes")
          .update({ current_uses: newUses })
          .eq("id", bookingData.discount_code_id);
      }

      // Redirect to confirmation
      router.push(`/booking/${newBooking.id}`);
    } catch (error) {
      console.error("Error submitting booking:", error);
      alert("Error submitting booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0a0a0a] py-12">
          <div className="mx-auto max-w-6xl px-6 flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-700 border-t-amber-400" />
          </div>
        </main>
      </>
    );
  }

  if (!space || !availability) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-[#0a0a0a] py-12">
          <div className="mx-auto max-w-6xl px-6">
            <div className="rounded-lg border border-red-500/30 bg-red-900/10 p-6 text-center">
              <p className="text-red-400">This date is no longer available. Please select another date.</p>
              <button
                onClick={() => router.push("/")}
                className="mt-4 rounded-lg border border-amber-500/50 bg-amber-500/10 px-6 py-2 text-amber-400 hover:bg-amber-500/20"
              >
                Back to Calendar
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  const basePrice =
    selectedStart !== null && selectedEnd !== null
      ? (selectedEnd - selectedStart) * space.hourly_rate
      : 0;

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

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              {format(parse(dateParam, "yyyy-MM-dd", new Date()), "EEEE, MMMM d, yyyy")}
            </h1>
            <p className="text-gray-400">
              Hourly rate: ${space.hourly_rate}/hour (Minimum {space.min_booking_hours} hours)
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TimeSlotPicker
                date={dateParam}
                availabilityData={[availability]}
                bookings={bookings}
                minHours={space.min_booking_hours}
                hourlyRate={space.hourly_rate}
                selectedStart={selectedStart}
                selectedEnd={selectedEnd}
                onStartChange={setSelectedStart}
                onEndChange={setSelectedEnd}
              />
            </div>

            <div>
              {selectedStart !== null && selectedEnd !== null && (
                <div className="sticky top-20 rounded-lg border border-amber-500/30 bg-amber-500/5 p-6">
                  <h3 className="mb-4 text-lg font-semibold text-white">Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Duration</span>
                      <span className="text-white font-medium">
                        {selectedEnd - selectedStart} hours
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Rate</span>
                      <span className="text-white font-medium">
                        ${space.hourly_rate}/hr
                      </span>
                    </div>
                    <div className="border-t border-amber-500/20 pt-3 flex justify-between">
                      <span className="text-white font-semibold">Subtotal</span>
                      <span className="text-amber-400 font-bold">
                        ${basePrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedStart !== null && selectedEnd !== null && (
            <div className="mt-12">
              <h2 className="mb-6 text-2xl font-bold text-white">Complete Your Booking</h2>
              <BookingForm
                date={dateParam}
                startHour={selectedStart}
                endHour={selectedEnd}
                basePrice={basePrice}
                depositPercentage={depositPercentage}
                addOns={addOns}
                spaceId={space.id}
                onSubmit={handleSubmit}
                isLoading={submitting}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
