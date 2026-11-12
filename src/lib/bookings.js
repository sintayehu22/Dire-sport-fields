import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import {
  SLOT_INTERVAL_MINUTES,
  isValidEatDate,
  isValidEatTime,
  minutesOfDay,
  timeFromMinutes,
} from "./eatTime.mjs";

const MAX_PLAYERS = 30;
const MAX_DURATION_HOURS = 3;
const PHONE_PATTERN = /^(?:\+?251|0)?[79]\d{8}$/;

export class BookingError extends Error {
  constructor(message, code = "BOOKING_FAILED") {
    super(message);
    this.name = "BookingError";
    this.code = code;
  }
}

function getDatabase() {
  if (!db) {
    throw new BookingError(
      "The booking service is not configured.",
      "FIREBASE_NOT_CONFIGURED",
    );
  }

  return db;
}

function cleanRequiredText(value, field, min, max) {
  const text = String(value ?? "").trim();
  if (text.length < min || text.length > max) {
    throw new BookingError(
      `${field} must be between ${min} and ${max} characters.`,
      "VALIDATION",
    );
  }
  return text;
}

export function addOneHour(hhmm) {
  if (!isValidEatTime(hhmm) || minutesOfDay(hhmm) % 60 !== 0) {
    throw new Error("Start times must be on the hour.");
  }

  const endMinutes = minutesOfDay(hhmm) + 60;
  if (endMinutes > 24 * 60) {
    throw new Error("A booking cannot continue past midnight.");
  }

  return timeFromMinutes(endMinutes);
}

/**
 * Creates a simple booking request directly in Firestore. This does not reserve
 * a time slot or start a payment; the venue confirms the request separately.
 */
export async function createBooking(booking) {
  const fieldName = cleanRequiredText(
    booking?.fieldName ?? booking?.facility?.name,
    "Field name",
    2,
    150,
  );
  const customerName = cleanRequiredText(
    booking?.customerName,
    "Customer name",
    2,
    100,
  );
  const phoneNumber = String(
    booking?.phoneNumber ?? booking?.customerPhone ?? "",
  ).trim();
  const normalizedPhone = phoneNumber.replace(/[\s-]/g, "");
  const preferredDate = String(
    booking?.preferredDate ?? booking?.date ?? "",
  ).trim();
  const preferredTime = String(
    booking?.preferredTime ?? booking?.startTime ?? "No preference",
  ).trim();
  const attendees = Number(booking?.attendees ?? booking?.playerCount ?? 1);
  const notes = String(booking?.notes ?? "").trim().slice(0, 500);

  if (!PHONE_PATTERN.test(normalizedPhone)) {
    throw new BookingError(
      "Enter a valid Ethiopian phone number, e.g. 0912345678 or +251912345678.",
      "VALIDATION",
    );
  }
  if (!isValidEatDate(preferredDate)) {
    throw new BookingError("Choose a valid preferred date.", "VALIDATION");
  }
  if (!preferredTime || preferredTime.length > 50) {
    throw new BookingError("Choose a valid preferred time.", "VALIDATION");
  }
  if (
    !Number.isInteger(attendees) ||
    attendees < 1 ||
    attendees > MAX_PLAYERS
  ) {
    throw new BookingError(
      `A booking can include between 1 and ${MAX_PLAYERS} attendees.`,
      "VALIDATION",
    );
  }

  const payload = {
    fieldName,
    customerName,
    phoneNumber,
    preferredDate,
    preferredTime,
    attendees,
    notes,
    createdAt: new Date(),
  };
  const reference = await addDoc(
    collection(getDatabase(), "bookings"),
    payload,
  );

  return { id: reference.id, ...payload };
}

export async function getBookingById(bookingId) {
  const id = cleanRequiredText(bookingId, "Booking reference", 8, 128);
  const snapshot = await getDoc(doc(getDatabase(), "bookingGroups", id));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

/** Availability is display-only; booking requests do not reserve these slots. */
export async function getFacilityBookedIntervals(facilityId, date) {
  if (
    typeof facilityId !== "string" ||
    !facilityId.trim() ||
    !isValidEatDate(date)
  ) {
    throw new BookingError(
      "Choose a valid facility and booking date.",
      "VALIDATION",
    );
  }

  const locksQuery = query(
    collection(getDatabase(), "fieldReservations"),
    where("fieldId", "==", facilityId.trim()),
    where("date", "==", date),
  );

  try {
    const snapshot = await getDocs(locksQuery);
    const intervals = snapshot.docs.flatMap((lockDocument) => {
      const lock = lockDocument.data();
      const status = lock.status ?? "pending";
      if (status === "cancelled" || status === "rejected") return [];

      const validStatus = status === "pending" || status === "confirmed";
      const validTime =
        isValidEatTime(lock.timeSlot) &&
        minutesOfDay(lock.timeSlot) % SLOT_INTERVAL_MINUTES === 0 &&
        minutesOfDay(lock.timeSlot) + SLOT_INTERVAL_MINUTES <= 24 * 60;

      if (!validStatus || !validTime) {
        throw new BookingError(
          "The availability data is inconsistent. Please refresh and try again.",
          "AVAILABILITY_DATA_INVALID",
        );
      }

      return [
        {
          start: lock.timeSlot,
          end: timeFromMinutes(
            minutesOfDay(lock.timeSlot) + SLOT_INTERVAL_MINUTES,
          ),
        },
      ];
    });

    intervals.sort((a, b) => minutesOfDay(a.start) - minutesOfDay(b.start));
    return intervals.reduce((merged, interval) => {
      const previous = merged.at(-1);
      if (
        previous &&
        minutesOfDay(interval.start) <= minutesOfDay(previous.end)
      ) {
        if (minutesOfDay(interval.end) > minutesOfDay(previous.end)) {
          previous.end = interval.end;
        }
      } else {
        merged.push({ ...interval });
      }
      return merged;
    }, []);
  } catch (error) {
    if (error instanceof BookingError) throw error;
    throw new BookingError(
      "We could not check availability. Please check your connection and try again.",
      "AVAILABILITY_FAILED",
    );
  }
}

export async function createFacilityRequest(request) {
  const customerName = cleanRequiredText(
    request?.customerName,
    "Customer name",
    2,
    100,
  );
  const customerPhone = String(request?.customerPhone ?? "")
    .trim()
    .replace(/[\s-]/g, "");

  if (!PHONE_PATTERN.test(customerPhone)) {
    throw new BookingError(
      "Enter a valid Ethiopian phone number, e.g. 0912345678 or +251912345678.",
      "VALIDATION",
    );
  }
  if (!isValidEatDate(request?.date)) {
    throw new BookingError(
      "Choose a valid preferred date for your visit.",
      "VALIDATION",
    );
  }

  const partySize = request?.partySize ?? null;
  if (
    partySize !== null &&
    (!Number.isInteger(partySize) ||
      partySize < 1 ||
      partySize > MAX_PLAYERS)
  ) {
    throw new BookingError(
      "Group size must be between 1 and 30 people.",
      "VALIDATION",
    );
  }

  const durationHours = request?.durationHours ?? null;
  if (
    durationHours !== null &&
    (!Number.isInteger(durationHours) ||
      durationHours < 1 ||
      durationHours > MAX_DURATION_HOURS)
  ) {
    throw new BookingError(
      "Duration must be 1, 2, or 3 hours.",
      "VALIDATION",
    );
  }

  const payload = {
    facilityId: cleanRequiredText(
      request?.facilityId,
      "Facility reference",
      2,
      128,
    ),
    facilityName: cleanRequiredText(
      request?.facilityName,
      "Facility name",
      2,
      150,
    ),
    neighborhood: String(request?.neighborhood ?? "").trim().slice(0, 120),
    category: String(request?.category ?? "").trim().slice(0, 30),
    pricingType: String(request?.pricingType ?? "").trim().slice(0, 30),
    plan: request?.plan ? String(request.plan).trim().slice(0, 100) : null,
    date: request.date,
    preferredTime: request?.preferredTime
      ? String(request.preferredTime).trim().slice(0, 50)
      : null,
    durationHours,
    partySize,
    message: request?.message
      ? String(request.message).trim().slice(0, 500)
      : null,
    customerName,
    customerPhone,
    status: "pending",
    createdAt: new Date(),
  };
  const reference = await addDoc(
    collection(getDatabase(), "facilityRequests"),
    payload,
  );

  return { id: reference.id, ...payload };
}
