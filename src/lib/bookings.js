import { signInAnonymously } from "firebase/auth";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { getFirebaseServices } from "./firebase";

const MAX_PLAYERS = 30;
const MAX_DURATION_HOURS = 3;

function addOneHour(hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || minutes !== 0) {
    throw new Error("Start times must be on the hour.");
  }
  if (hours < 0 || hours >= 24) {
    throw new Error("Invalid start time.");
  }
  return `${String(hours + 1).padStart(2, "0")}:00`;
}

/**
 * @param {{
 *   fieldId: string;
 *   fieldName: string;
 *   location: string;
 *   hourlyPrice: number | null;
 *   date: string;
 *   timeSlot: string;
 *   durationHours: number;
 *   playerCount: number;
 *   customerName: string;
 *   customerPhone: string;
 *   invitedPlayers?: string[];
 * }} booking
 */
export async function createBookingGroup(booking) {
  const { auth, db } = getFirebaseServices();
  const user = auth.currentUser ?? (await signInAnonymously(auth)).user;

  const durationHours = Number(booking.durationHours) || 1;
  const participantCount =
    booking.playerCount ?? (booking.invitedPlayers?.length ?? 0) + 1;
  const invitedPlayers = booking.invitedPlayers ?? [];

  if (!Number.isInteger(participantCount) || participantCount < 1) {
    throw new Error("A booking must include at least one player.");
  }
  if (participantCount > MAX_PLAYERS) {
    throw new Error(`A booking can include at most ${MAX_PLAYERS} players.`);
  }
  if (
    !Number.isInteger(durationHours) ||
    durationHours < 1 ||
    durationHours > MAX_DURATION_HOURS
  ) {
    throw new Error("Booking duration must be 1, 2, or 3 hours.");
  }

  const hasPrice =
    typeof booking.hourlyPrice === "number" &&
    Number.isFinite(booking.hourlyPrice) &&
    booking.hourlyPrice > 0;
  const pricePending = !hasPrice;
  const totalPriceEtb = hasPrice ? booking.hourlyPrice * durationHours : 0;
  const shareAmountEtb = hasPrice ? totalPriceEtb / participantCount : 0;

  // Every hour of the window gets its own reservation to lock the whole period.
  const bookedSlots = [];
  let cursor = booking.timeSlot;
  for (let i = 0; i < durationHours; i += 1) {
    bookedSlots.push(cursor);
    cursor = addOneHour(cursor);
  }

  const bookingRef = doc(collection(db, "bookingGroups"));
  const reservationRefs = bookedSlots.map((slot) =>
    doc(
      db,
      "fieldReservations",
      `${booking.fieldId}_${booking.date}_${slot.replace(":", "-")}`,
    ),
  );

  await runTransaction(db, async (transaction) => {
    for (const reservationRef of reservationRefs) {
      const reservation = await transaction.get(reservationRef);
      if (reservation.exists()) {
        throw new Error(
          "That time slot was just booked. Please choose another one.",
        );
      }
    }

    reservationRefs.forEach((reservationRef, index) => {
      transaction.set(reservationRef, {
        fieldId: booking.fieldId,
        date: booking.date,
        timeSlot: bookedSlots[index],
        bookingGroupId: bookingRef.id,
        ownerUid: user.uid,
        createdAt: serverTimestamp(),
      });
    });

    transaction.set(bookingRef, {
      fieldId: booking.fieldId,
      fieldName: booking.fieldName,
      location: booking.location,
      date: booking.date,
      timeSlot: booking.timeSlot,
      durationHours,
      hourlyPriceEtb: hasPrice ? booking.hourlyPrice : 0,
      totalPriceEtb,
      pricePending,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      participantCount,
      invitedPlayers,
      participants: [
        {
          userId: user.uid,
          name: booking.customerName,
          phone: booking.customerPhone,
          role: "organizer",
          paymentStatus: "pending",
          amountOwedEtb: shareAmountEtb,
        },
        ...invitedPlayers.map((email) => ({
          email,
          role: "player",
          paymentStatus: "pending",
          amountOwedEtb: shareAmountEtb,
        })),
      ],
      ownerUid: user.uid,
      status: "pending",
      createdAt: serverTimestamp(),
    });
  });

  return { id: bookingRef.id, shareAmountEtb, participantCount, pricePending };
}

const PHONE_PATTERN = /^(?:\+?251|0)?[79]\d{8}$/;

/**
 * Booking enquiry for non-football facilities (gyms, swimming, court sports,
 * recreation). These venues do not sell online hourly slots yet, so the request
 * is stored and the venue confirms availability and price directly.
 *
 * @param {{
 *   facilityId: string;
 *   facilityName: string;
 *   neighborhood: string;
 *   category: string;
 *   pricingType: string;
 *   plan?: string | null;
 *   date: string;
 *   preferredTime?: string | null;
 *   durationHours?: number | null;
 *   partySize?: number | null;
 *   message?: string;
 *   customerName: string;
 *   customerPhone: string;
 * }} request
 */
export async function createFacilityRequest(request) {
  const { auth, db } = getFirebaseServices();
  const user = auth.currentUser ?? (await signInAnonymously(auth)).user;

  const customerName = String(request.customerName ?? "").trim();
  const customerPhone = String(request.customerPhone ?? "").replace(/[\s-]/g, "");
  if (customerName.length < 2) {
    throw new Error("Enter the full name for the booking.");
  }
  if (!PHONE_PATTERN.test(customerPhone)) {
    throw new Error(
      "Enter a valid Ethiopian phone number, e.g. 0912345678 or +251912345678.",
    );
  }
  if (!request.date) {
    throw new Error("Choose a preferred date for your visit.");
  }

  const partySize = request.partySize ?? null;
  if (partySize !== null && (!Number.isInteger(partySize) || partySize < 1 || partySize > 30)) {
    throw new Error("Group size must be between 1 and 30 people.");
  }
  const durationHours = request.durationHours ?? null;
  if (durationHours !== null && (!Number.isInteger(durationHours) || durationHours < 1 || durationHours > 3)) {
    throw new Error("Duration must be 1, 2, or 3 hours.");
  }

  const requestRef = doc(collection(db, "facilityRequests"));
  await setDoc(requestRef, {
    facilityId: request.facilityId,
    facilityName: request.facilityName,
    neighborhood: String(request.neighborhood ?? ""),
    category: request.category,
    pricingType: request.pricingType,
    plan: request.plan ?? null,
    date: request.date,
    preferredTime: request.preferredTime ?? null,
    durationHours,
    partySize,
    message: request.message ? request.message.trim().slice(0, 500) : null,
    customerName,
    customerPhone,
    ownerUid: user.uid,
    status: "pending",
    createdAt: serverTimestamp(),
  });

  return { id: requestRef.id };
}
