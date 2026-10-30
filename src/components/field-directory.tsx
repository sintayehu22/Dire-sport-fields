"use client";

import Image from "next/image";
import { useMemo, useState, type FormEvent } from "react";
import { createBookingGroup } from "@/src/lib/bookings";
import { fields, type FootballField } from "@/src/lib/fields";

const formatEtb = (amount: number) =>
  `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ETB`;

function getLocalDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getLocalTimeString(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function FieldCard({
  field,
  onBook,
}: {
  field: FootballField;
  onBook: (field: FootballField) => void;
}) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-[#e7e9e1] bg-white shadow-[0_12px_35px_rgba(27,45,34,0.04)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(27,45,34,0.1)]">
      <div className="relative h-52 overflow-hidden bg-[#163d2b]">
        <Image
          src={field.imagePlaceholder}
          alt={`Illustration of ${field.name}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full border border-white/20 bg-[#112a20]/75 px-3 py-1.5 text-xs font-semibold tracking-wide text-white backdrop-blur">
          DIRE DAWA
        </span>
        <span className="absolute bottom-4 right-4 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#17412e]">
          {field.capacity} players
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-xl font-bold tracking-tight text-[#17261e]">
            {field.name}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-[#69766d]">
            <svg
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-[#4c795c]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            {field.location}
          </p>
        </div>

        <div className="mb-5 flex items-center justify-between border-y border-[#eef0ea] py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#78847b]">
              Surface
            </p>
            <p className="mt-1 text-sm font-semibold text-[#26372d]">{field.surface}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#78847b]">
              Price per hour
            </p>
            <p className="mt-1 text-lg font-extrabold text-[#17412e]">
              {formatEtb(field.hourlyPrice)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onBook(field)}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1d573a] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#17452f] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1d573a]/25"
        >
          Book field
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
            <path
              d="M4 10h12m-5-5 5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </article>
  );
}

function BookingDialog({
  field,
  onClose,
}: {
  field: FootballField;
  onClose: () => void;
}) {
  const today = useMemo(() => getLocalDateString(new Date()), []);
  const [date, setDate] = useState(today);
  const [timeSlot, setTimeSlot] = useState(field.availableTimeSlots[0] ?? "");
  const [inviteText, setInviteText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const availableTimeSlots = field.availableTimeSlots.filter(
    (slot) => date !== today || slot > getLocalTimeString(new Date()),
  );
  const selectedTimeSlot = availableTimeSlots.includes(timeSlot)
    ? timeSlot
    : (availableTimeSlots[0] ?? "");

  const invitedPlayers = inviteText
    .split(/[\s,;]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const uniqueInvites = [...new Set(invitedPlayers)];
  const participantCount = uniqueInvites.length + 1;
  const shareAmount = field.hourlyPrice / participantCount;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setConfirmation("");

    if (!date || date < today) {
      setErrorMessage("Choose today or a future date for your booking.");
      return;
    }

    if (!availableTimeSlots.includes(selectedTimeSlot)) {
      setErrorMessage("There are no available times for that date. Choose another date.");
      return;
    }

    if (uniqueInvites.length > 20) {
      setErrorMessage("A booking group can include up to 20 invited players.");
      return;
    }

    const invalidEmail = uniqueInvites.find(
      (email) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    );
    if (invalidEmail) {
      setErrorMessage(`"${invalidEmail}" does not look like a valid email address.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const booking = await createBookingGroup({
        fieldId: field.id,
        fieldName: field.name,
        location: field.location,
        hourlyPrice: field.hourlyPrice,
        date,
        timeSlot: selectedTimeSlot,
        invitedPlayers: uniqueInvites,
      });
      setConfirmation(
        `Booking group ${booking.id} created. ${booking.participantCount} players owe ${formatEtb(booking.shareAmountEtb)} each. Payments are pending.`,
      );
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#10251a]/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-title"
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#548064]">
              One-hour booking
            </p>
            <h2 id="booking-title" className="mt-2 text-2xl font-extrabold text-[#17261e]">
              Book {field.name}
            </h2>
            <p className="mt-1 text-sm text-[#69766d]">
              {field.location} · {formatEtb(field.hourlyPrice)} total
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close booking dialog"
            className="rounded-full p-2 text-[#69766d] transition hover:bg-[#f1f3ee] hover:text-[#17261e] disabled:opacity-50"
          >
            <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 20 20" fill="none">
              <path
                d="m5 5 10 10M15 5 5 15"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#26372d]">
              Date
              <input
                type="date"
                min={today}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className="mt-2 min-h-12 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-base font-normal text-[#26372d] outline-none focus:border-[#4c795c] focus:ring-4 focus:ring-[#4c795c]/10"
              />
            </label>
            <label className="block text-sm font-semibold text-[#26372d]">
              Available start time
              <select
                value={selectedTimeSlot}
                onChange={(event) => setTimeSlot(event.target.value)}
                required
                disabled={availableTimeSlots.length === 0}
                className="mt-2 min-h-12 w-full rounded-xl border border-[#dfe5dc] bg-white px-3 text-base font-normal text-[#26372d] outline-none focus:border-[#4c795c] focus:ring-4 focus:ring-[#4c795c]/10"
              >
                {availableTimeSlots.length === 0 && (
                  <option value="">No times available for this date</option>
                )}
                {availableTimeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm font-semibold text-[#26372d]">
            Invite players
            <textarea
              value={inviteText}
              onChange={(event) => setInviteText(event.target.value)}
              placeholder="Add email addresses separated by commas or spaces"
              rows={3}
              className="mt-2 w-full resize-y rounded-xl border border-[#dfe5dc] bg-white px-3 py-3 text-base font-normal text-[#26372d] outline-none placeholder:text-[#9aa39b] focus:border-[#4c795c] focus:ring-4 focus:ring-[#4c795c]/10"
            />
            <span className="mt-2 block text-xs font-normal text-[#78847b]">
              You are included as the organizer. Up to 20 invited players.
            </span>
          </label>

          <div className="rounded-2xl border border-[#e4e9e0] bg-[#f7f9f4] p-4">
            <div className="flex items-center justify-between text-sm text-[#536158]">
              <span>Field · 1 hour</span>
              <span className="font-semibold text-[#26372d]">{formatEtb(field.hourlyPrice)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-[#536158]">
              <span>{participantCount} players · estimate per player</span>
              <span className="font-bold text-[#17412e]">{formatEtb(shareAmount)}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[#78847b]">
              Payment is not collected here. Each player’s share will be marked pending.
            </p>
          </div>

          {errorMessage && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">
              {errorMessage}
            </p>
          )}
          {confirmation && (
            <p role="status" className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-900">
              {confirmation}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || Boolean(confirmation)}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#1d573a] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#17452f] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#1d573a]/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Creating booking group..."
              : confirmation
                ? "Booking group created"
                : "Create booking group"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default function FieldDirectory() {
  const [selectedField, setSelectedField] = useState<FootballField | null>(null);

  return (
    <main className="min-h-screen">
      <header className="border-b border-[#e5e9e1] bg-[#f5f6f1]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <a href="#" className="flex items-center gap-3" aria-label="Dire Sport Fields home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1d573a] text-white">
              <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="m9 8 3-2 3 2-1 3h-4L9 8Zm-1 7 2-4m6 4-2-4m-3 5v-4m-4 3 4 3 4-3"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-base font-extrabold tracking-tight text-[#17261e] sm:text-lg">
              Dire Sport Fields
            </span>
          </a>
          <a
            href="#fields"
            className="rounded-full border border-[#dce3da] px-4 py-2 text-sm font-semibold text-[#284b36] transition hover:border-[#1d573a] hover:bg-white"
          >
            Find a field
          </a>
        </div>
      </header>

      <section className="relative isolate overflow-hidden bg-[#163d2b]">
        <div
          aria-hidden="true"
          className="absolute -right-36 -top-56 -z-10 h-[34rem] w-[34rem] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-16 -top-36 -z-10 h-[24rem] w-[24rem] rounded-full border border-white/10"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#d3e6d3]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#a5d495]" />
              MADE FOR THE GAME IN DIRE DAWA
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-[-0.04em] text-white sm:text-6xl">
              Your next match
              <br />
              starts <span className="text-[#b8df9f]">right here.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-[#d1dfd3] sm:text-lg sm:leading-8">
              Find a pitch, bring your team together, and split the cost without the back-and-forth.
              Local fields. One simple booking.
            </p>
            <a
              href="#fields"
              className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#c4e6a8] px-5 py-3 text-sm font-extrabold text-[#193e2a] transition hover:bg-[#d4edbe]"
            >
              Explore fields
              <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
                <path
                  d="M4 10h12m-5-5 5 5-5 5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </div>

          <div className="hidden justify-self-end lg:block">
            <div className="relative flex h-72 w-72 items-center justify-center rounded-full border border-white/15 bg-white/[0.04]">
              <div className="absolute inset-5 rounded-full border border-dashed border-white/20" />
              <div className="absolute left-0 top-1/2 h-px w-full bg-white/15" />
              <div className="absolute left-1/2 top-0 h-full w-px bg-white/15" />
              <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
              <div className="relative flex h-28 w-28 items-center justify-center rounded-[2rem] bg-[#c4e6a8] shadow-[0_24px_70px_rgba(0,0,0,0.25)]">
                <svg aria-hidden="true" className="h-16 w-16 text-[#19452e]" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
                  <path
                    d="m9 8 3-2 3 2-1 3h-4L9 8Zm-1 7 2-4m6 4-2-4m-3 5v-4m-4 3 4 3 4-3"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="absolute -bottom-3 right-4 rounded-full bg-white px-4 py-2 text-xs font-bold text-[#1d573a] shadow-lg">
                PLAY TOGETHER
              </span>
            </div>
          </div>
        </div>
      </section>

      <section id="fields" className="mx-auto max-w-7xl scroll-mt-8 px-5 py-16 sm:px-8 sm:py-20">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#548064]">
              Find your pitch
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#17261e] sm:text-4xl">
              Fields around Dire Dawa
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#69766d] sm:text-base">
              Choose a field and invite your players. Prices and times shown are sample listings.
            </p>
          </div>
          <p className="text-sm font-semibold text-[#536158]">
            {fields.length} local fields
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map((field) => (
            <FieldCard key={field.id} field={field} onBook={setSelectedField} />
          ))}
        </div>
      </section>

      <footer className="border-t border-[#e5e9e1] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-sm text-[#69766d] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span className="font-semibold text-[#284b36]">Dire Sport Fields</span>
          <span>Sample field details and availability for Dire Dawa, Ethiopia.</span>
        </div>
      </footer>

      {selectedField && (
        <BookingDialog field={selectedField} onClose={() => setSelectedField(null)} />
      )}
    </main>
  );
}
