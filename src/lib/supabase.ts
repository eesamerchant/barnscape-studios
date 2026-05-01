import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Space = {
  id: string;
  name: string;
  slug: string;
  description: string;
  hourly_rate: number;
  min_booking_hours: number;
  max_booking_hours: number;
};

export type Availability = {
  id: string;
  date: string;
  start_hour: number;
  end_hour: number;
  is_available: boolean;
  note: string | null;
};

export type Booking = {
  id: string;
  space_id: string;
  date: string;
  start_hour: number;
  end_hour: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  etransfer_reference: string | null;
  total_amount: number;
  deposit_amount: number;
  discount_code_id: string | null;
  discount_amount: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  payment_verified: boolean;
  notes: string | null;
};

export type AddOn = {
  id: string;
  name: string;
  description: string;
  price: number;
  space_id: string | null;
  is_active: boolean;
};

export type BookingAddOn = {
  id: string;
  booking_id: string;
  add_on_id: string;
  quantity: number;
  price_at_booking: number;
};

export type DiscountCode = {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_booking_amount: number;
  max_uses: number;
  current_uses: number;
  space_id: string | null;
  is_active: boolean;
  expires_at: string | null;
};

export type Settings = {
  id: string;
  key: string;
  value: Record<string, any>;
};
