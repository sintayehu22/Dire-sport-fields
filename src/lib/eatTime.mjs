/**
 * Ethiopian local time (EAT) helpers for booking.
 *
 * Dire Dawa uses East Africa Time (Africa/Addis_Ababa), fixed UTC+3 with no DST.
 * All booking dates/times are civil (Gregorian) wall-clock values in EAT:
 *  - bookingDate  "YYYY-MM-DD"
 *  - startTime/endTime "HH:mm" (24-hour clock)
 *
 * Slot-lock model:
 *  - Every booking covers fixed one-hour slot intervals (SLOT_INTERVAL_MINUTES).
 *  - Booking storage keeps EAT wall-clock values for display. Past-time
 *    validation compares those values with the EAT wall clock, never the browser.
 *
 * The file is plain ESM (.mjs) so the booking test script can run it directly
 * with node without a TypeScript loader.
 */

export const EAT_TIME_ZONE = "Africa/Addis_Ababa";
export const EAT_OFFSET_MINUTES = 180; // EAT = UTC+3, fixed (no DST)
export const SLOT_INTERVAL_MINUTES = 60;

const pad2 = (value) => String(value).padStart(2, "0");

/** Civil wall clock in Dire Dawa right now: { date: "YYYY-MM-DD", minutes: 0..1439 } */
export function eatNowParts() {
  const shifted = new Date(Date.now() + EAT_OFFSET_MINUTES * 60_000);
  return {
    date: `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`,
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

/** Is this a real Gregorian calendar date, e.g. rejects 2026-02-30? */
export function isValidEatDate(date) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  const probe = new Date(Date.UTC(year, month - 1, day));
  return (
    probe.getUTCFullYear() === year &&
    probe.getUTCMonth() === month - 1 &&
    probe.getUTCDate() === day
  );
}

/** 24-hour "HH:mm" between 00:00 and 23:59. */
export function isValidEatTime(time) {
  return typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export function minutesOfDay(time) {
  if (time === "24:00") return 24 * 60;
  if (!isValidEatTime(time)) throw new Error("Invalid time.");
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function timeFromMinutes(totalMinutes) {
  if (!Number.isInteger(totalMinutes) || totalMinutes < 0 || totalMinutes > 24 * 60) {
    throw new Error("Time must be within one calendar day.");
  }
  if (totalMinutes === 24 * 60) return "24:00";
  return `${pad2(Math.floor(totalMinutes / 60))}:${pad2(totalMinutes % 60)}`;
}

/** EAT civil date+time -> UTC instant (Date). Returns null for invalid input. */
export function eatToUtc(date, time) {
  if (!isValidEatDate(date) || (!isValidEatTime(time) && time !== "24:00")) return null;
  const [year, month, day] = date.split("-").map(Number);
  const total = minutesOfDay(time);
  return new Date(Date.UTC(year, month - 1, day, Math.floor(total / 60) - 3, total % 60));
}

/** UTC epoch milliseconds -> EAT wall clock { date, time, minutes }. */
export function utcToEat(epochMs) {
  const shifted = new Date(epochMs + EAT_OFFSET_MINUTES * 60_000);
  const time = `${pad2(shifted.getUTCHours())}:${pad2(shifted.getUTCMinutes())}`;
  return {
    date: `${shifted.getUTCFullYear()}-${pad2(shifted.getUTCMonth() + 1)}-${pad2(shifted.getUTCDate())}`,
    time,
    minutes: shifted.getUTCHours() * 60 + shifted.getUTCMinutes(),
  };
}

/** "November 15, 2026" — Gregorian, formatted for EAT. */
export function formatEatDateLong(date) {
  if (!isValidEatDate(date)) return date ?? "";
  const [year, month, day] = date.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EAT_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day, 12, 0)));
}

/** "2:00 PM" — format the EAT wall clock, independent of browser timezone. */
export function formatEatTime12(time) {
  if (time === "24:00") return "12:00 AM";
  if (!isValidEatTime(time)) return time ?? "";
  const instant = eatToUtc("2024-01-15", time);
  return new Intl.DateTimeFormat("en-US", {
    timeZone: EAT_TIME_ZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(instant);
}

/** Server timestamp (Firestore Timestamp/Date/epoch) -> "November 15, 2026 – 2:00 PM EAT". */
export function formatEatTimestamp(timestampLike) {
  const date =
    timestampLike instanceof Date
      ? timestampLike
      : typeof timestampLike?.toDate === "function"
        ? timestampLike.toDate()
        : new Date(timestampLike);
  if (Number.isNaN(date.getTime())) return "";
  const text = new Intl.DateTimeFormat("en-US", {
    timeZone: EAT_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return `${text} EAT`;
}

/** The reserved slot times ("HH:mm") covered by [startTime, endTime). */
export function computeLockTimes(startTime, endTime) {
  if (!isValidEatTime(startTime) || (!isValidEatTime(endTime) && endTime !== "24:00")) {
    throw new Error("Invalid booking time.");
  }
  const startMinutes = minutesOfDay(startTime);
  const endMinutes = minutesOfDay(endTime);
  if (endMinutes <= startMinutes) {
    throw new Error("End time must be after start time.");
  }
  if (
    startMinutes % SLOT_INTERVAL_MINUTES !== 0 ||
    endMinutes % SLOT_INTERVAL_MINUTES !== 0
  ) {
    throw new Error("Booking times must align with the one-hour slot grid.");
  }
  const slotTimes = [];
  for (let minutes = startMinutes; minutes < endMinutes; minutes += SLOT_INTERVAL_MINUTES) {
    slotTimes.push(timeFromMinutes(minutes));
  }
  return slotTimes;
}

/** Deterministic hourly reservation id; retains the original Firestore ID format. */
export function computeLockId(facilityId, date, timeSlot) {
  if (!isValidEatDate(date) || !isValidEatTime(timeSlot)) {
    throw new Error("Invalid reservation date or time.");
  }
  return `${facilityId}_${date}_${timeSlot.replace(":", "-")}`;
}

export function computeLockIds(facilityId, date, startTime, endTime) {
  return computeLockTimes(startTime, endTime).map(
    (slotTime) => computeLockId(facilityId, date, slotTime),
  );
}

/** The client-side half of the overlap rule: newStart < existingEnd && newEnd > existingStart. */
export function intervalsOverlap(aStart, aEnd, bStart, bEnd) {
  return minutesOfDay(aStart) < minutesOfDay(bEnd) && minutesOfDay(aEnd) > minutesOfDay(bStart);
}

/** Crypto-random id fallback for environments without crypto.randomUUID(). */
export function randomToken(fallbackPrefix = "tok") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const chunk = Math.random().toString(36).slice(2);
  return `${fallbackPrefix}-${chunk}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
