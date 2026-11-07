"use client";

import { useEffect, useMemo, useState } from "react";
import { createFacilityRequest } from "@/src/lib/bookings";
import SportIcon from "@/src/components/SportIcon";

const DURATIONS = [1, 2, 3];
const TIME_PREFERENCES = ["Morning", "Afternoon", "Evening"];
const COURT_CATEGORIES = ["basketball", "volleyball", "tennis", "badminton", "handball"];
const FALLBACK_GYM_PLANS = [
  "Daily access",
  "Weekly membership",
  "Monthly membership",
  "Training session (if offered)",
];

const formatEtb = (amount) =>
  `${amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} ETB`;

function getLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function hasPrice(value) {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isCourtCategory(category) {
  return COURT_CATEGORIES.includes(category);
}

function partySizeLabel(category) {
  if (isCourtCategory(category)) return "Number of players";
  return "Number of attendees";
}

function PriceSummary({ facility, plan, durationHours, partySize }) {
  if (isCourtCategory(facility.category)) {
    const total = hasPrice(facility.hourlyPrice) ? facility.hourlyPrice * durationHours : null;
    return (
      <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
        <span>
          {facility.name} · {durationHours} hour{durationHours > 1 ? "s" : ""}
          {partySize ? ` · ${partySize} players` : ""}
        </span>
        <span className="font-semibold text-white">
          {total !== null ? formatEtb(total) : "Contact for availability"}
        </span>
      </div>
    );
  }
  if (facility.pricingType === "per_person" || facility.category === "swimming") {
    const total = hasPrice(facility.perPersonPrice) ? facility.perPersonPrice * partySize : null;
    return (
      <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
        <span>
          {facility.name}
          {partySize ? ` · ${partySize} visitors` : ""}
        </span>
        <span className="font-semibold text-white">
          {total !== null ? formatEtb(total) : "Contact for price"}
        </span>
      </div>
    );
  }
  if (facility.pricingType === "membership") {
    const pricedPlan = facility.membershipPlans.find((p) => p.label === plan);
    const total = pricedPlan && hasPrice(pricedPlan.price) ? pricedPlan.price : null;
    return (
      <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
        <span>
          {facility.name} · {plan}
        </span>
        <span className="font-semibold text-white">
          {total !== null ? formatEtb(total) : "Contact for price"}
        </span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-between gap-4 text-sm text-slate-300">
      <span>{facility.name}</span>
      <span className="font-semibold text-white">Contact for price</span>
    </div>
  );
}

export default function FacilityRequestModal({ facility, onClose }) {
  const today = useMemo(() => getLocalDate(new Date()), []);
  const [date, setDate] = useState(today);
  const [preferredTime, setPreferredTime] = useState("");
  const [durationHours, setDurationHours] = useState(1);
  const [plan, setPlan] = useState("");
  const [partySize, setPartySize] = useState(isCourtCategory(facility.category) ? 10 : 3);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const gymPlanOptions =
    facility.pricingType === "membership"
      ? facility.membershipPlans.length > 0
        ? facility.membershipPlans.map((p) => p.label)
        : FALLBACK_GYM_PLANS
      : [];

  const selectedPlan = plan || gymPlanOptions[0] || "";

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSubmitting, onClose]);

  const showCourtFields = isCourtCategory(facility.category);
  const showSwimFields =
    facility.category === "swimming" || facility.activities.includes("swimming");
  const showGymPlans =
    facility.pricingType === "membership" && facility.category === "gym";

  async function handleSubmit(event) {
    event.preventDefault();
    setErrorMessage("");
    setConfirmation("");

    const name = customerName.trim();
    if (name.length < 2) {
      setErrorMessage("Enter the full name for the booking.");
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
      setErrorMessage("Choose today or a future date for your visit.");
      return;
    }

    const players = Number(partySize);
    if (!Number.isInteger(players) || players < 1 || players > 30) {
      setErrorMessage("Choose between 1 and 30 attendees.");
      return;
    }

    setIsSubmitting(true);
    try {
      const request = await createFacilityRequest({
        facilityId: facility.id,
        facilityName: facility.name,
        neighborhood: facility.neighborhood,
        category: facility.category,
        pricingType: facility.pricingType,
        plan: showGymPlans ? selectedPlan || null : null,
        date,
        preferredTime: showCourtFields ? preferredTime || "Any time" : showSwimFields ? (preferredTime || "Any session") : null,
        durationHours: showCourtFields ? durationHours : null,
        partySize: players,
        message,
        customerName: name,
        customerPhone: phone,
      });
      setConfirmation(
        `Request ${request.id} sent for ${facility.name} on ${date}. The venue will call you to confirm availability and pricing — nothing is charged here.`,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "We couldn't send your request. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const cardButton =
    "min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25";
  const cardButtonActive = "border-emerald-400 bg-emerald-500/15 text-emerald-300";
  const cardButtonIdle =
    "border-white/10 bg-slate-950 text-slate-300 hover:border-emerald-400/50";
  const inputBase =
    "min-h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-base font-normal text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15";
  const inputClass = `mt-2 ${inputBase}`;
  const labelClass = "block text-sm font-semibold text-slate-200";

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
        aria-labelledby="facility-request-title"
        className="max-h-[94vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-slate-900 p-5 shadow-2xl sm:rounded-3xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
              <SportIcon sport={facility.category} />
              Booking request
            </p>
            <h2
              id="facility-request-title"
              className="mt-2 text-2xl font-extrabold text-white"
            >
              {facility.name}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              {facility.neighborhood} · Contact for availability
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close booking request dialog"
            className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <span aria-hidden="true" className="text-xl leading-none">×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Your name
              <input
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                required
                minLength={2}
                placeholder="e.g. Nuredin Jemal"
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Phone number
              <input
                type="tel"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                required
                placeholder="0912345678"
                className={inputClass}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className={labelClass}>
              Preferred date
              <input
                type="date"
                min={today}
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className={`${inputClass} [color-scheme:dark]`}
              />
            </label>

            {showGymPlans ? (
              <label className={labelClass}>
                Membership plan
                <select
                  value={selectedPlan}
                  onChange={(event) => setPlan(event.target.value)}
                  className={inputBase}
                >
                  {gymPlanOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
          ) : (
            <label className={labelClass}>
              {showCourtFields ? "Preferred time" : showSwimFields ? "Session" : "Preferred time"}
                <select
                  value={preferredTime}
                  onChange={(event) => setPreferredTime(event.target.value)}
                  className={inputBase}
                >
                  <option value="">No preference</option>
                  {TIME_PREFERENCES.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {showCourtFields && (
            <fieldset>
              <legend className="text-sm font-semibold text-slate-200">
                Session length
              </legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {DURATIONS.map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    aria-pressed={durationHours === hours}
                    onClick={() => setDurationHours(hours)}
                    className={`${cardButton} ${
                      durationHours === hours ? cardButtonActive : cardButtonIdle
                    }`}
                  >
                    {hours} hour{hours > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <label className={labelClass}>
            {partySizeLabel(facility.category)}
            <input
              type="number"
              min="1"
              max="30"
              step="1"
              value={partySize}
              onChange={(event) => setPartySize(Number(event.target.value))}
              required
              className={inputClass}
            />
            <span className="mt-2 block text-xs font-normal text-slate-400">
              {showCourtFields
                ? "Includes you. Group size may be limited by the venue."
                : "Total attendees for the visit or session."}
            </span>
          </label>

          <label className={labelClass}>
            Notes for the venue (optional)
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Anything the venue should know — preferred days, age group, trainer requests…"
              rows={3}
              maxLength={500}
              className="mt-2 w-full resize-y rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-base font-normal text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15"
            />
          </label>

          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
            <PriceSummary
              facility={facility}
              plan={selectedPlan}
              durationHours={durationHours}
              partySize={Number(partySize)}
            />
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Prices are not confirmed online yet, so your selection is sent as a booking
              request. The venue calls you back to confirm the time and final price.
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
            disabled={isSubmitting || Boolean(confirmation)}
            className="flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting
              ? "Sending request..."
              : confirmation
                ? "Request sent"
                : "Send booking request"}
          </button>
        </form>
      </section>
    </div>
  );
}
