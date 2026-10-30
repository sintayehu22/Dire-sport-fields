import { signInAnonymously } from "firebase/auth";
import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { getFirebaseServices } from "./firebase";

/**
 * @param {{
 *   fieldId: string;
 *   fieldName: string;
 *   location: string;
 *   hourlyPrice: number;
 *   date: string;
 *   timeSlot: string;
 *   invitedPlayers: string[];
 * }} booking
 */
export async function createBookingGroup(booking) {
  const { auth, db } = getFirebaseServices();
  const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
  const participantCount = booking.invitedPlayers.length + 1;
  const shareAmountEtb = booking.hourlyPrice / participantCount;
  const bookingRef = doc(collection(db, "bookingGroups"));
  const slotId = `${booking.fieldId}_${booking.date}_${booking.timeSlot.replace(":", "-")}`;
  const reservationRef = doc(db, "fieldReservations", slotId);

  await runTransaction(db, async (transaction) => {
    const reservation = await transaction.get(reservationRef);
    if (reservation.exists()) {
      throw new Error("That time slot was just booked. Please choose another one.");
    }

    transaction.set(reservationRef, {
      fieldId: booking.fieldId,
      date: booking.date,
      timeSlot: booking.timeSlot,
      bookingGroupId: bookingRef.id,
      ownerUid: user.uid,
      createdAt: serverTimestamp(),
    });

    transaction.set(bookingRef, {
      fieldId: booking.fieldId,
      fieldName: booking.fieldName,
      location: booking.location,
      date: booking.date,
      timeSlot: booking.timeSlot,
      durationHours: 1,
      hourlyPriceEtb: booking.hourlyPrice,
      totalPriceEtb: booking.hourlyPrice,
      invitedPlayers: booking.invitedPlayers,
      participants: [
        {
          userId: user.uid,
          role: "organizer",
          paymentStatus: "pending",
          amountOwedEtb: shareAmountEtb,
        },
        ...booking.invitedPlayers.map((email) => ({
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

  return { id: bookingRef.id, shareAmountEtb, participantCount };
}
