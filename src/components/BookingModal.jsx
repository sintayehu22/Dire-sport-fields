"use client";

import { useEffect, useMemo, useState } from "react";
import { createBookingGroup } from "@/src/lib/bookings";

const DURATIONS = [1, 2, 3];

const formatEtb = (amount) =>
  `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ETB`;

function getLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalTime(date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function addOneHour(hhmm) {
  const [hours] = hhmm.split(":").map(Number);
  return `${String(hours + 1).padStart(2, "0")}:00`;
}

function buildWindows(field, duration) {
  const slots = Array.isArray(field.availableTimeSlots) ? field.availableTimeSlots : [];
  const windows = [];
  for (const slot of slots) {
    let cursor = slot;
    let valid = true;
    for (let hour = 0; hour < duration; hour += 1) {
      if (!slots.includes(cursor)) {
        valid = false;
        break;
      }
      cursor = addOneHour(cursor);
    }
    if (valid) windows.push({ start: slot, end: cursor });
  }
  return windows;
}

export default function BookingModal({ field, onClose }) {
  const today = useMemo(() => getLocalDate(new Date()), []);
  const nowTime = useMemo(() => getLocalTime(new Date()), []);
  const [durationHours, setDurationHours] = useState(1);
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState("");
  const [playerCount, setPlayerCount] = useState(6);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const maxPlayers =
    Number.isInteger(field.capacity) && field.capacity > 0
      ? Math.min(field.capacity, 30)
      : 22;

  const hasPrice =
    typeof field.hourlyPrice === "number" && Number.isFinite(field.hourlyPrice);
  const totalPrice = hasPrice ? field.hourlyPrice * durationHours : null;
  const costPerPlayer = hasPrice && totalPrice !== null && playerCount > 0 ? totalPrice / playerCount : null;

  const windows = useMemo(
    () => buildWindows(field, durationHours),
    [field, durationHours],
  );

  const availableWindows = useMemo(
    () =>
      windows.filter((window) => date !== today || window.start > nowTime),
    [windows, date, today, nowTime],
  );

  const selectedWindow =
    availableWindows.find((w) => w.start === startTime)
    ?? availableWindows[0]
    ?? null;

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setConfirmation("");

    const name = customerName.trim();
    if (name.length < 2) {
      setErrorMessage("Enter the full name for the booking (at least 2 characters).");
      return;
    }

    const phone = customerPhone.trim();
    if (!/^(?:\+?251|0)?[79]\d{8}$/.test(phone.replace(/[\s-]/g, ""))) {
      setErrorMessage(
        "Enter a valid Ethiopian phone number, e.g. 0912345678 or +251912345678.",
      );
      return;
    }

    if (!date || date < today) {
      setErrorMessage("Choose today or a future date for your booking.");
      return;
    }

    if (!selectedWindow) {
      setErrorMessage("There are no available time windows for that date. Choose another date.");
      return;
    }

    const players = Number(playerCount);
    if (!Number.isInteger(players) || players < 1 || players > maxPlayers) {
      setErrorMessage(`Choose between 1 and ${maxPlayers} players.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const booking = await createBookingGroup({
        fieldId: field.id,
        fieldName: field.name,
        location: field.neighborhood,
        hourlyPrice: field.hourlyPrice,
        date,
        timeSlot: selectedWindow.start,
        durationHours,
        playerCount: players,
        customerName: name,
        customerPhone: phone,
        invitedPlayers: [],
      });
      if (booking.pricePending) {
        setConfirmation(
          `Booking ${booking.id} created for ${booking.participantCount} players on ${date}, ${selectedWindow.start}–${selectedWindow.end}. The field owner will confirm the price; payment is pending.`,
        );
      } else {
        setConfirmation(
          `Booking ${booking.id} created. Total ${formatEtb(field.hourlyPrice * durationHours)}, ${booking.participantCount} players owe ${formatEtb(booking.shareAmountEtb)} each. Payments are pending.`,
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't create your booking. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl sm:rounded-3xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
              Field booking
            </p>
            <h2
              id="booking-modal-title"
              className="mt-2 text-2xl font-extrabold text-white"
            >
              Book {field.name}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {field.neighborhood}
              {field.googleMapsUrl && (
                <>
                  {" · "}
                  <a
                    href={field.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-emerald-400 underline decoration-dotted hover:text-emerald-300"
                  >
                    View on Google Maps
                  </a>
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close booking dialog"
            className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <span aria-hidden="true" className="text-xl leading-none">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-200">
              Customer name
              <input
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                required
                minLength={2}
                placeholder="e.g. Ali Mohammed"
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-base font-normal text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
              />
            </label>
            <label className="block text-sm font-semibold text-slate-200">
              Phone number
              <input
                type="tel"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                required
                placeholder="0912345678"
                className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-base font-normal text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
              />
            </label>
          </div>

          <label className="block text-sm font-semibold text-slate-200">
            Booking date
            <input
              type="date"
              min={today}
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-base font-normal text-white outline-none [color-scheme:dark] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            />
          </label>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-200">
              Duration
            </legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {DURATIONS.map((hours) => (
                <button
                  key={hours}
                  type="button"
                  aria-pressed={durationHours === hours}
                  onClick={() => {
                    setDurationHours(hours);
                    setStartTime("");
                  }}
                  className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25 ${
                    durationHours === hours
                      ? "border-emerald-400 bg-emerald-500/15 text-emerald-300"
                      : "border-white/10 bg-slate-950 text-slate-300 hover:border-emerald-400/50"
                  }`}
                >
                  {hours} hour{hours > 1 ? "s" : ""}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block text-sm font-semibold text-slate-200">
            Starting time
            <select
              value={selectedWindow?.start ?? ""}
              onChange={(event) => setStartTime(event.target.value)}
              required
              disabled={availableWindows.length === 0}
              className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-base font-normal text-white outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 disabled:text-slate-500"
            >
              {availableWindows.length === 0 ? (
                <option value="">
                  No {durationHours > 1 ? `${durationHours}-hour ` : ""}windows available this date
                </option>
              ) : (
                availableWindows.map((window) => (
                  <option key={window.start} value={window.start}>
                    {window.start} – {window.end}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-200">
            Number of players
            <input
              type="number"
              min="1"
              max={maxPlayers}
              step="1"
              value={playerCount}
              onChange={(event) => setPlayerCount(Number(event.target.value))}
              required
              className="mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-base font-normal text-white outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            />
            <span className="mt-2 block text-xs font-normal text-slate-400">
              Includes you. {field.capacity
                ? `Field capacity: ${field.capacity} players.`
                : "App limit: 22 players until the capacity is confirmed."}
            </span>
          </label>

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
              <span>Field · {durationHours} hour{durationHours > 1 ? "s" : ""}</span>
              <span className="font-semibold text-white">
                {hasPrice ? formatEtb(field.hourlyPrice) : "Contact field owner for price"}
              </span>
            </div>
            {hasPrice && (
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4 text-slate-300">
                  <dt>Total for {durationHours} hour{durationHours > 1 ? "s" : ""}</dt>
                  <dd className="font-bold text-emerald-400">{formatEtb(totalPrice)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 text-slate-300">
                  <dt>{playerCount} players · each pays</dt>
                  <dd className="font-bold text-emerald-400">
                    {costPerPlayer !== null ? formatEtb(costPerPlayer) : "—"}
                  </dd>
                </div>
              </dl>
            )}
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {hasPrice
                ? "Total price = hourly price × duration. Payment is not collected here; each player’s share is marked pending."
                : "The hourly price is not confirmed yet, so no total can be calculated. The field owner will quote the price after your booking request."}
            </p>
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
            >
              {errorMessage}
            </p>
          )}
          {confirmation && (
            <p
              role="status"
              className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200"
            >
              {confirmation}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || Boolean(confirmation) || availableWindows.length === 0}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Creating booking..."
              : confirmation
                ? "Booking created"
                : "Confirm Booking"}
          </button>
        </form>
      </section>
    </div>
  );
}
