import { minutesOfDay } from "../src/lib/eatTime.mjs";

export const PAYMENT_WINDOW_MS = 30 * 60 * 1000;
export const PHONE_PATTERN = /^(?:\+?251|0)?[79]\d{8}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEthiopianPhone(value) {
  const phone = String(value ?? "").replace(/[\s()-]/g, "");
  if (!PHONE_PATTERN.test(phone)) return null;
  const national = phone.replace(/^\+/, "");
  if (national.startsWith("251")) return `0${national.slice(3)}`;
  if (national.startsWith("9") || national.startsWith("7")) return `0${national}`;
  return national;
}

export function validateBookingInput(data, catalog, nowParts) {
  const field = catalog[data?.facilityId];
  if (!field) throw new Error("This field is not available for online booking.");

  const customerName = String(data.customerName ?? "").trim();
  const customerEmail = String(data.customerEmail ?? "").trim().toLowerCase();
  const customerPhone = normalizeEthiopianPhone(data.customerPhone);
  const date = data.date;
  const startTime = data.startTime;
  const durationHours = Number(data.durationHours);
  const playerCount = Number(data.playerCount);

  if (customerName.length < 2 || customerName.length > 100) {
    throw new Error("Enter your name using 2 to 100 characters.");
  }
  if (!EMAIL_PATTERN.test(customerEmail) || customerEmail.length > 254) {
    throw new Error("Enter a valid email address for payment.");
  }
  if (!customerPhone) throw new Error("Enter a valid Ethiopian phone number.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? "")) {
    throw new Error("Choose a valid booking date.");
  }
  const [year, month, day] = date.split("-").map(Number);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));
  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    throw new Error("Choose a valid booking date.");
  }
  if (date < nowParts.date) throw new Error("Choose today or a future date.");
  if (!/^([01]\d|2[0-3]):00$/.test(startTime ?? "")) {
    throw new Error("Choose a valid starting time.");
  }
  if (
    date === nowParts.date &&
    minutesOfDay(startTime) <= nowParts.minutes
  ) {
    throw new Error("That starting time has already passed.");
  }
  if (![1, 2, 3].includes(durationHours)) {
    throw new Error("Booking duration must be 1, 2, or 3 hours.");
  }
  if (
    !Number.isInteger(playerCount) ||
    playerCount < 1 ||
    playerCount > field.maxPlayers
  ) {
    throw new Error(`Choose between 1 and ${field.maxPlayers} players.`);
  }

  const reservedSlots = Array.from({ length: durationHours }, (_, index) => {
    const slot = minutesOfDay(startTime) + index * 60;
    if (slot >= 24 * 60) throw new Error("A booking cannot continue past midnight.");
    const time = `${String(Math.floor(slot / 60)).padStart(2, "0")}:${String(slot % 60).padStart(2, "0")}`;
    if (!field.availableTimeSlots.includes(time)) {
      throw new Error("That time is outside this field's available hours.");
    }
    return time;
  });

  return {
    field,
    customerName,
    customerEmail,
    customerPhone,
    date,
    startTime,
    durationHours,
    playerCount,
    reservedSlots,
  };
}

function timestampMillis(timestamp) {
  if (typeof timestamp?.toMillis === "function") return timestamp.toMillis();
  if (typeof timestamp === "number") return timestamp;
  return Number.NaN;
}

export function isBookingPaymentExpired(booking, nowMs) {
  if (booking.status === "expired" || booking.status === "cancelled") return true;
  if (booking.status === "pending_payment") {
    return timestampMillis(booking.paymentExpiresAt) <= nowMs;
  }
  if (booking.status === "pending") {
    const explicitExpiry = timestampMillis(booking.paymentExpiresAt);
    const createdAt = timestampMillis(booking.createdAt);
    const expiry =
      Number.isFinite(explicitExpiry) && explicitExpiry > 0
        ? explicitExpiry
        : Number.isFinite(createdAt)
          ? createdAt + PAYMENT_WINDOW_MS
          : 0;
    return expiry <= nowMs;
  }
  return false;
}

export function getPaymentDisposition({
  booking,
  attempt,
  verification,
  now,
  reservationsMatch,
}) {
  const providerData = verification?.data;
  if (
    verification?.status === "success" &&
    ["pending", "processing"].includes(providerData?.status)
  ) {
    return { type: "pending" };
  }
  const paid =
    verification?.status === "success" &&
    providerData?.status === "success";
  if (!paid) return { type: "failed", reason: "Payment was not verified as successful." };

  const amount = Number(providerData.amount);
  const validTransaction =
    providerData.tx_ref === attempt.txRef &&
    providerData.currency === attempt.currency &&
    Number.isFinite(amount) &&
    amount === attempt.amountEtb;
  if (!validTransaction) {
    return { type: "review", reason: "Verified payment details did not match the booking." };
  }

  if (booking.status !== "pending_payment") {
    return { type: "review", reason: "The reservation is no longer awaiting payment." };
  }
  if (now >= timestampMillis(booking.paymentExpiresAt)) {
    return { type: "review", reason: "Payment was verified after the reservation expired." };
  }
  if (!reservationsMatch) {
    return { type: "review", reason: "The reservation no longer owns every selected time slot." };
  }

  return { type: "confirm" };
}
