"use client";

import { useEffect, useRef, useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../lib/firebase";

function getLocalDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getInitialForm() {
  return {
    customerName: "",
    phoneNumber: "",
    preferredDate: getLocalDate(),
    preferredTime: "",
    attendees: "1",
    notes: "",
  };
}

function getSubmissionErrorMessage(error) {
  const connectionErrorCodes = [
    "unavailable",
    "firestore/unavailable",
    "network-request-failed",
    "firestore/network-request-failed",
  ];

  if (connectionErrorCodes.includes(error?.code)) {
    return "We could not connect to the booking service. Check your connection and try again.";
  }

  return "We could not send your booking request right now. Please try again later.";
}

export default function BookingModal({ field, onClose }) {
  const [today] = useState(getLocalDate);
  const [form, setForm] = useState(getInitialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const closeTimerRef = useRef(null);

  const capacity = Number(field?.capacity);
  const maxAttendees =
    Number.isInteger(capacity) && capacity > 0 ? capacity : 30;
  const availableTimes = Array.isArray(field?.availableTimeSlots)
    ? [...new Set(field.availableTimeSlots)].filter((time) =>
        /^([01]\d|2[0-3]):[0-5]\d$/.test(time),
      )
    : [];

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  useEffect(
    () => () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
    },
    [],
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (errorMessage) setErrorMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmitting) return;

    setErrorMessage("");
    setSuccessMessage("");

    const customerName = form.customerName.trim();
    const phoneNumber = form.phoneNumber.trim();
    const attendees = Number(form.attendees);
    const notes = form.notes.trim();

    if (customerName.length < 2) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!/^(?:\+?251|0)?[79]\d{8}$/.test(phoneNumber.replace(/[\s-]/g, ""))) {
      setErrorMessage("Please enter a valid Ethiopian phone number.");
      return;
    }

    if (!form.preferredDate || form.preferredDate < today) {
      setErrorMessage("Please choose today or a future date.");
      return;
    }

    if (
      !Number.isInteger(attendees) ||
      attendees < 1 ||
      attendees > maxAttendees
    ) {
      setErrorMessage(`Please enter between 1 and ${maxAttendees} attendees.`);
      return;
    }

    setIsSubmitting(true);

    try {
      if (!db) {
        throw new Error("Firebase is not configured.");
      }

      await addDoc(collection(db, "bookings"), {
        fieldName: field?.name || "Football Pitch",
        customerName,
        phoneNumber,
        preferredDate: form.preferredDate,
        preferredTime: form.preferredTime || "No preference",
        attendees,
        notes,
        createdAt: new Date(),
      });

      setForm(getInitialForm());
      setSuccessMessage(
        "Your booking request was sent successfully. The field team will contact you soon.",
      );
      closeTimerRef.current = window.setTimeout(onClose, 1800);
    } catch (submissionError) {
      console.error("Unable to submit booking request:", submissionError);
      setErrorMessage(getSubmissionErrorMessage(submissionError));
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "mt-2 min-h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-base font-normal text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60";

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
              Book {field?.name}
            </h2>
            {(field?.neighborhood || field?.location) && (
              <p className="mt-1 text-sm text-slate-400">
                {field?.neighborhood ?? field?.location}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close booking dialog"
            className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <span aria-hidden="true" className="text-xl leading-none">
              ×
            </span>
          </button>
        </div>

        {successMessage ? (
          <div className="space-y-5 text-center">
            <div
              role="status"
              className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-6 text-emerald-100"
            >
              <div
                aria-hidden="true"
                className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-400 text-2xl font-bold text-slate-950"
              >
                ✓
              </div>
              <p className="font-bold">Booking request sent</p>
              <p className="mt-2 text-sm leading-6 text-emerald-200">
                {successMessage}
              </p>
              <p className="mt-3 text-xs text-emerald-300">
                This window will close automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="min-h-12 w-full rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/30"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-200">
                Customer name
                <input
                  type="text"
                  name="customerName"
                  value={form.customerName}
                  onChange={handleChange}
                  minLength={2}
                  required
                  autoComplete="name"
                  disabled={isSubmitting}
                  placeholder="Your full name"
                  className={inputClass}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-200">
                Phone number
                <input
                  type="tel"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  required
                  autoComplete="tel"
                  disabled={isSubmitting}
                  placeholder="0912345678"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-200">
                Preferred date
                <input
                  type="date"
                  name="preferredDate"
                  min={today}
                  value={form.preferredDate}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className={`${inputClass} [color-scheme:dark]`}
                />
              </label>

              <label className="block text-sm font-semibold text-slate-200">
                Preferred time
                {availableTimes.length > 0 ? (
                  <select
                    name="preferredTime"
                    value={form.preferredTime}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    className={inputClass}
                  >
                    <option value="">No preference / Choose a time</option>
                    {availableTimes.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="preferredTime"
                    value={form.preferredTime}
                    onChange={handleChange}
                    disabled={isSubmitting}
                    placeholder="e.g. Afternoon / 15:00"
                    className={inputClass}
                  />
                )}
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-200">
              Number of attendees
              <input
                type="number"
                name="attendees"
                min="1"
                max={maxAttendees}
                step="1"
                value={form.attendees}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className={inputClass}
              />
              <span className="mt-2 block text-xs font-normal text-slate-400">
                Maximum {maxAttendees} attendees.
              </span>
            </label>

            <label className="block text-sm font-semibold text-slate-200">
              Notes <span className="font-normal text-slate-500">(optional)</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows={4}
                maxLength={500}
                disabled={isSubmitting}
                placeholder="Add any details the field team should know"
                className={`${inputClass} py-3`}
              />
            </label>

            {errorMessage && (
              <p
                role="alert"
                aria-live="assertive"
                className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
              >
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              className="flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sending request..." : "Send booking request"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
