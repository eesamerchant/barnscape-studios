"use client";

import { useState } from "react";
import type { AddOn, DiscountCode } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";

interface BookingFormProps {
  date: string;
  startHour: number;
  endHour: number;
  basePrice: number;
  depositPercentage: number;
  addOns: AddOn[];
  spaceId: string;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export function BookingForm({
  date,
  startHour,
  endHour,
  basePrice,
  depositPercentage,
  addOns,
  spaceId,
  onSubmit,
  isLoading,
}: BookingFormProps) {
  const [selectedAddOns, setSelectedAddOns] = useState<
    Map<string, number>
  >(new Map());
  const [discountCode, setDiscountCode] = useState("");
  const [discountData, setDiscountData] = useState<DiscountCode | null>(null);
  const [discountError, setDiscountError] = useState("");
  const [applyingDiscount, setApplyingDiscount] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    etransferReference: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Calculate total
  const addOnPrice = Array.from(selectedAddOns.entries()).reduce(
    (sum, [addOnId, quantity]) => {
      const addOn = addOns.find((a) => a.id === addOnId);
      return sum + (addOn ? addOn.price * quantity : 0);
    },
    0
  );

  const discountAmount = discountData
    ? discountData.type === "percentage"
      ? (basePrice + addOnPrice) * (discountData.value / 100)
      : discountData.value
    : 0;

  const total = basePrice + addOnPrice - discountAmount;
  const deposit = total * (depositPercentage / 100);

  const handleAddOnChange = (addOnId: string, quantity: number) => {
    const newMap = new Map(selectedAddOns);
    if (quantity <= 0) {
      newMap.delete(addOnId);
    } else {
      newMap.set(addOnId, quantity);
    }
    setSelectedAddOns(newMap);
  };

  const validateDiscount = async () => {
    if (!discountCode) {
      setDiscountError("");
      setDiscountData(null);
      return;
    }

    setApplyingDiscount(true);
    setDiscountError("");

    try {
      const { data: discount, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", discountCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !discount) {
        setDiscountError("Invalid discount code");
        setDiscountData(null);
        return;
      }

      // Check expiry
      if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
        setDiscountError("This discount code has expired");
        setDiscountData(null);
        return;
      }

      // Check uses
      if (discount.current_uses >= discount.max_uses) {
        setDiscountError("This discount code has reached its usage limit");
        setDiscountData(null);
        return;
      }

      // Check min booking amount
      if (basePrice + addOnPrice < discount.min_booking_amount) {
        setDiscountError(
          `Minimum booking amount of $${discount.min_booking_amount} required`
        );
        setDiscountData(null);
        return;
      }

      // Check space applicability
      if (
        discount.space_id &&
        discount.space_id !== spaceId
      ) {
        setDiscountError("This discount code is not valid for this space");
        setDiscountData(null);
        return;
      }

      setDiscountData(discount);
      setDiscountError("");
    } catch (err) {
      setDiscountError("Error validating discount code");
      setDiscountData(null);
    } finally {
      setApplyingDiscount(false);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errors.email = "Invalid email address";

    if (!formData.phone.trim()) errors.phone = "Phone is required";
    if (!formData.etransferReference.trim())
      errors.etransferReference = "E-transfer reference is required";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const bookingData = {
      date,
      start_hour: startHour,
      end_hour: endHour,
      customer_name: formData.name,
      customer_email: formData.email,
      customer_phone: formData.phone,
      etransfer_reference: formData.etransferReference,
      total_amount: total,
      deposit_amount: deposit,
      discount_code_id: discountData?.id || null,
      discount_amount: discountAmount,
      notes: formData.notes || null,
      add_ons: Array.from(selectedAddOns.entries()).map(([addOnId, quantity]) => ({
        add_on_id: addOnId,
        quantity,
      })),
    };

    await onSubmit(bookingData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Add-ons Section */}
      {addOns.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Add-Ons (Optional)</h3>
          <div className="space-y-3">
            {addOns.map((addOn) => (
              <div
                key={addOn.id}
                className="flex items-center justify-between rounded-lg border border-gray-700/50 bg-gray-900/30 p-4 glass"
              >
                <div className="flex-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAddOns.has(addOn.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          handleAddOnChange(addOn.id, 1);
                        } else {
                          handleAddOnChange(addOn.id, 0);
                        }
                      }}
                      className="h-4 w-4 rounded border-gray-600 bg-gray-800 accent-amber-400"
                    />
                    <div>
                      <p className="font-medium text-white">{addOn.name}</p>
                      {addOn.description && (
                        <p className="text-xs text-gray-400">{addOn.description}</p>
                      )}
                    </div>
                  </label>
                </div>
                {selectedAddOns.has(addOn.id) && (
                  <div className="ml-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleAddOnChange(addOn.id, (selectedAddOns.get(addOn.id) || 1) - 1)
                      }
                      className="rounded bg-gray-700 px-2 py-1 text-sm text-white hover:bg-gray-600"
                    >
                      -
                    </button>
                    <span className="w-8 text-center text-white">
                      {selectedAddOns.get(addOn.id)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddOnChange(addOn.id, (selectedAddOns.get(addOn.id) || 1) + 1)
                      }
                      className="rounded bg-gray-700 px-2 py-1 text-sm text-white hover:bg-gray-600"
                    >
                      +
                    </button>
                  </div>
                )}
                <div className="ml-4 text-right">
                  <p className="font-semibold text-amber-400">${addOn.price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discount Code Section */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-300">
          Discount Code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={discountCode}
            onChange={(e) => {
              setDiscountCode(e.target.value.toUpperCase());
              setDiscountData(null);
            }}
            placeholder="Enter code (optional)"
            className="flex-1 rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={validateDiscount}
            disabled={applyingDiscount || !discountCode}
            className="rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 font-medium text-amber-400 hover:border-amber-500/80 hover:bg-amber-500/20 disabled:opacity-50"
          >
            {applyingDiscount ? "Checking..." : "Apply"}
          </button>
        </div>
        {discountError && (
          <p className="text-sm text-red-400">{discountError}</p>
        )}
        {discountData && (
          <p className="text-sm text-green-400">
            Discount applied: {discountData.type === "percentage" ? `${discountData.value}%` : `$${discountData.value}`} off
          </p>
        )}
      </div>

      {/* Customer Info Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Your Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full rounded-lg border bg-gray-800 px-4 py-2 text-white placeholder-gray-500 focus:outline-none ${
              formErrors.name
                ? "border-red-500 focus:border-red-500"
                : "border-gray-600 focus:border-amber-400"
            }`}
            placeholder="John Doe"
          />
          {formErrors.name && (
            <p className="mt-1 text-sm text-red-400">{formErrors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full rounded-lg border bg-gray-800 px-4 py-2 text-white placeholder-gray-500 focus:outline-none ${
              formErrors.email
                ? "border-red-500 focus:border-red-500"
                : "border-gray-600 focus:border-amber-400"
            }`}
            placeholder="john@example.com"
          />
          {formErrors.email && (
            <p className="mt-1 text-sm text-red-400">{formErrors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className={`w-full rounded-lg border bg-gray-800 px-4 py-2 text-white placeholder-gray-500 focus:outline-none ${
              formErrors.phone
                ? "border-red-500 focus:border-red-500"
                : "border-gray-600 focus:border-amber-400"
            }`}
            placeholder="(555) 123-4567"
          />
          {formErrors.phone && (
            <p className="mt-1 text-sm text-red-400">{formErrors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Additional Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            className="w-full rounded-lg border border-gray-600 bg-gray-800 px-4 py-2 text-white placeholder-gray-500 focus:border-amber-400 focus:outline-none"
            placeholder="Let us know if you have any special requests..."
          />
        </div>
      </div>

      {/* Payment Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Payment & Summary</h3>

        <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-6">
          <div className="flex justify-between text-gray-300">
            <span>Base Rate ({endHour - startHour}h)</span>
            <span>${basePrice.toFixed(2)}</span>
          </div>

          {addOnPrice > 0 && (
            <div className="flex justify-between text-gray-300">
              <span>Add-Ons</span>
              <span>${addOnPrice.toFixed(2)}</span>
            </div>
          )}

          {discountAmount > 0 && (
            <div className="flex justify-between text-green-400">
              <span>Discount</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="border-t border-amber-500/20 pt-3 flex justify-between font-semibold text-white">
            <span>Total</span>
            <span className="text-amber-400 text-lg">${total.toFixed(2)}</span>
          </div>

          <div className="border-t border-amber-500/20 pt-3 flex justify-between text-gray-300">
            <span>Deposit Required ({depositPercentage}%)</span>
            <span className="font-semibold text-amber-400">
              ${deposit.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="rounded-lg bg-blue-900/20 border border-blue-500/30 p-4 space-y-2">
          <p className="text-sm font-medium text-blue-300">E-Transfer Instructions:</p>
          <p className="text-sm text-blue-200">
            Please send ${deposit.toFixed(2)} via e-transfer. Your booking reference will be provided after submission.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            E-Transfer Reference Number *
          </label>
          <input
            type="text"
            value={formData.etransferReference}
            onChange={(e) =>
              setFormData({ ...formData, etransferReference: e.target.value })
            }
            className={`w-full rounded-lg border bg-gray-800 px-4 py-2 text-white placeholder-gray-500 focus:outline-none ${
              formErrors.etransferReference
                ? "border-red-500 focus:border-red-500"
                : "border-gray-600 focus:border-amber-400"
            }`}
            placeholder="Enter the reference number from your e-transfer"
          />
          {formErrors.etransferReference && (
            <p className="mt-1 text-sm text-red-400">
              {formErrors.etransferReference}
            </p>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-lg border border-amber-500/50 bg-amber-500 px-6 py-3 font-semibold text-black hover:border-amber-400 hover:bg-amber-400 disabled:opacity-50"
      >
        {isLoading ? "Submitting..." : "Complete Booking"}
      </button>
    </form>
  );
}
