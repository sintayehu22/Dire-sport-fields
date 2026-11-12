import crypto from "node:crypto";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import {
  FieldValue,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { defineSecret, defineString } from "firebase-functions/params";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { HttpsError, onCall, onRequest } from "firebase-functions/v2/https";
import BOOKING_CATALOG from "../src/lib/booking-catalog.json" with { type: "json" };
import {
  computeLockId,
  computeLockIds,
  eatNowParts,
  isValidEatDate,
  minutesOfDay,
  timeFromMinutes,
} from "../src/lib/eatTime.mjs";
import {
  isBookingPaymentExpired,
  getPaymentDisposition,
  normalizeEthiopianPhone,
  PAYMENT_WINDOW_MS,
  validateBookingInput,
} from "./domain.js";
import {
  cleanText,
  validateFacilityPayload,
  validateFeedbackPayload,
  validateNotificationPayload,
  validateReviewPayload,
} from "./admin-domain.js";

const FUNCTION_REGION = "us-central1";
const app = getApps().length ? getApps()[0] : initializeApp();
const db = getFirestore(app);
const chapaSecretKey = defineSecret("CHAPA_SECRET_KEY");
const chapaWebhookSecret = defineSecret("CHAPA_WEBHOOK_SECRET_HASH");
const appBaseUrl = defineString("APP_BASE_URL");
const providerApi = "https://api.chapa.co/v1";

function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Sign in before managing a booking.");
  }
  return request.auth.uid;
}

function requireAdmin(request) {
  const uid = requireAuth(request);
  if (request.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "Administrator access is required.");
  }
  return {
    uid,
    email: typeof request.auth.token.email === "string" ? request.auth.token.email : null,
  };
}

function adminActivity(admin, action, targetType, targetId, details = "") {
  return {
    adminUid: admin.uid,
    adminEmail: admin.email,
    action,
    targetType,
    targetId,
    details: String(details).trim().slice(0, 1_000),
    createdAt: Timestamp.now(),
  };
}

function writeAdminActivity(transaction, admin, action, targetType, targetId, details = "") {
  const ref = db.collection("adminActivityLog").doc();
  transaction.set(ref, adminActivity(admin, action, targetType, targetId, details));
}

async function assertCustomerAllowed(uid) {
  const snapshot = await db.collection("customerAdmin").doc(uid).get();
  if (snapshot.exists && snapshot.data().status === "blocked") {
    throw new HttpsError(
      "permission-denied",
      "This customer account cannot create new platform requests. Contact support for help.",
    );
  }
}

async function assertBookingsEnabled() {
  const snapshot = await db.collection("platformSettings").doc("general").get();
  if (snapshot.exists && snapshot.data().bookingEnabled === false) {
    throw new HttpsError(
      "failed-precondition",
      "New bookings are temporarily paused by the platform administrator.",
    );
  }
}

async function trustedBookingField(facilityId) {
  if (typeof facilityId !== "string") return null;
  const catalogField = BOOKING_CATALOG[facilityId] ?? null;
  const snapshot = await db.collection("facilities").doc(facilityId).get();
  if (!snapshot.exists) return catalogField;

  const managed = snapshot.data();
  const merged = {
    ...(catalogField
      ? {
          name: catalogField.name,
          neighborhood: catalogField.neighborhood,
          hourlyPrice: catalogField.hourlyPriceEtb,
          maxPlayers: catalogField.maxPlayers,
          availableTimeSlots: catalogField.availableTimeSlots,
          pricingType: "hourly",
          availability: "bookable",
          isPublished: true,
        }
      : {}),
    ...managed,
  };
  if (
    merged.isPublished === false ||
    merged.archivedAt ||
    merged.availability !== "bookable" ||
    merged.pricingType !== "hourly" ||
    !Number.isFinite(Number(merged.hourlyPrice)) ||
    Number(merged.hourlyPrice) <= 0 ||
    !Array.isArray(merged.availableTimeSlots)
  ) {
    return null;
  }
  return {
    id: facilityId,
    name: merged.name,
    neighborhood: merged.neighborhood,
    hourlyPriceEtb: Number(merged.hourlyPrice),
    maxPlayers: Number.isInteger(merged.maxPlayers) ? merged.maxPlayers : 22,
    availableTimeSlots: merged.availableTimeSlots,
  };
}

function getChapaSecret() {
  const secret = chapaSecretKey.value();
  if (!secret.startsWith("CHASECK_TEST-")) {
    throw new HttpsError(
      "failed-precondition",
      "Payments are test-mode only. Configure a Chapa test secret key.",
    );
  }
  return secret;
}

function toMillis(value) {
  if (typeof value?.toMillis === "function") return value.toMillis();
  return Number.NaN;
}

function activePaymentLocks(booking, lockSnapshots) {
  return lockSnapshots.length === booking.reservedSlots.length &&
    lockSnapshots.every((snapshot, index) => {
      if (!snapshot.exists) return false;
      const lock = snapshot.data();
      return (
        lock.bookingGroupId === booking.id &&
        lock.ownerUid === booking.ownerUid &&
        lock.fieldId === booking.fieldId &&
        lock.date === booking.date &&
        lock.status === "pending" &&
        lock.timeSlot === booking.reservedSlots[index]
      );
    });
}

function reservationRefs(booking) {
  return booking.reservedSlots.map((slot) =>
    db.collection("fieldReservations").doc(
      computeLockId(booking.fieldId, booking.date, slot),
    ),
  );
}

function bookingSummary(id, booking) {
  return {
    bookingId: id,
    facilityName: booking.facilityName,
    sportCategory: "football",
    bookingDate: booking.date,
    startTime: booking.timeSlot,
    endTime: booking.endTime,
    durationHours: booking.durationHours,
    totalPriceEtb: booking.totalPriceEtb,
    currency: "ETB",
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    paymentExpiresAt: toMillis(booking.paymentExpiresAt),
    refundStatus: booking.refundStatus ?? null,
  };
}

export const createBooking = onCall({ region: FUNCTION_REGION }, async (request) => {
  const uid = requireAuth(request);
  const data = request.data ?? {};
  const requestId = data.requestId;
  if (
    typeof requestId !== "string" ||
    !/^[A-Za-z0-9_-]{8,128}$/.test(requestId)
  ) {
    throw new HttpsError("invalid-argument", "Booking request could not be started.");
  }

  await Promise.all([assertCustomerAllowed(uid), assertBookingsEnabled()]);
  const trustedField = await trustedBookingField(data.facilityId);
  if (!trustedField) {
    throw new HttpsError(
      "failed-precondition",
      "This facility is not currently available for online booking.",
    );
  }

  let input;
  try {
    input = validateBookingInput(
      data,
      { [data.facilityId]: trustedField },
      eatNowParts(),
    );
  } catch (error) {
    throw new HttpsError("invalid-argument", error.message);
  }

  const {
    field,
    customerName,
    customerEmail,
    customerPhone,
    date,
    startTime,
    durationHours,
    playerCount,
    reservedSlots,
  } = input;
  const nowMs = Date.now();
  const now = Timestamp.fromMillis(nowMs);
  const expiresAt = Timestamp.fromMillis(nowMs + PAYMENT_WINDOW_MS);
  const endTime = timeFromMinutes(minutesOfDay(startTime) + durationHours * 60);
  const totalPriceEtb = field.hourlyPriceEtb * durationHours;
  const bookingRef = db.collection("bookingGroups").doc(requestId);
  const lockRefs = computeLockIds(field.id ?? data.facilityId, date, startTime, endTime)
    .map((id) => db.collection("fieldReservations").doc(id));
  let reused = false;

  try {
    await db.runTransaction(async (transaction) => {
      const existingSnap = await transaction.get(bookingRef);
      if (existingSnap.exists) {
        const existing = existingSnap.data();
        if (
          existing.ownerUid !== uid ||
          existing.fieldId !== data.facilityId ||
          existing.date !== date ||
          existing.timeSlot !== startTime ||
          existing.durationHours !== durationHours
        ) {
          throw new HttpsError(
            "already-exists",
            "This booking request ID has already been used.",
          );
        }
        reused = true;
        return;
      }

      const locks = await Promise.all(lockRefs.map((ref) => transaction.get(ref)));
      const occupyingBookingIds = [
        ...new Set(
          locks
            .filter(
              (snapshot) =>
                snapshot.exists &&
                ["pending", "confirmed"].includes(snapshot.data().status),
            )
            .map((snapshot) => snapshot.data().bookingGroupId),
        ),
      ];
      const occupyingRefs = occupyingBookingIds.map((id) =>
        db.collection("bookingGroups").doc(id),
      );
      const occupyingBookings = await Promise.all(
        occupyingRefs.map((ref) => transaction.get(ref)),
      );
      const expiredBookings = [];
      for (let index = 0; index < occupyingBookings.length; index += 1) {
        const occupyingSnap = occupyingBookings[index];
        const lockOwnerId = occupyingBookingIds[index];
        if (!occupyingSnap.exists) {
          throw new HttpsError(
            "failed-precondition",
            "Availability data is inconsistent. Please refresh and try again.",
          );
        }
        const occupying = occupyingSnap.data();
        const expired =
          ["expired", "cancelled"].includes(occupying.status) ||
          (occupying.paymentStatus !== "paid" &&
            isBookingPaymentExpired(occupying, nowMs));
        if (!expired) {
          throw new HttpsError(
            "already-exists",
            "Sorry, this field is already reserved for that time. Choose another slot.",
          );
        }
        if (
          occupying.status === "pending_payment" ||
          occupying.status === "pending" ||
          occupying.status === "expired" ||
          occupying.status === "cancelled"
        ) {
          expiredBookings.push({ id: lockOwnerId, ref: occupyingRefs[index], booking: occupying });
        }
      }

      const staleLockRefs = expiredBookings.flatMap(({ id, booking }) =>
        reservationRefs({ ...booking, id }),
      );
      const allStaleRefs = [
        ...new Map(
          [...lockRefs, ...staleLockRefs].map((ref) => [ref.path, ref]),
        ).values(),
      ];
      const staleLockSnapshots = new Map(
        (await Promise.all(allStaleRefs.map((ref) => transaction.get(ref)))).map(
          (snapshot) => [snapshot.ref.path, snapshot],
        ),
      );
      const requestedLockPaths = new Set(lockRefs.map((ref) => ref.path));

      for (const { id, ref, booking } of expiredBookings) {
        if (booking.status === "pending_payment" || booking.status === "pending") {
          transaction.update(ref, {
            status: "expired",
            paymentStatus: "expired",
            paymentExpiresAt:
              toMillis(booking.paymentExpiresAt) > 0
                ? booking.paymentExpiresAt
                : Timestamp.fromMillis(
                    Number.isFinite(toMillis(booking.createdAt))
                      ? toMillis(booking.createdAt) + PAYMENT_WINDOW_MS
                      : nowMs,
                  ),
            expiredAt: now,
            activePaymentTxRef: FieldValue.delete(),
          });
        }
        for (const lockRef of reservationRefs({ ...booking, id })) {
          const lock = staleLockSnapshots.get(lockRef.path);
          if (
            lock?.exists &&
            lock.data().bookingGroupId === id &&
            !requestedLockPaths.has(lockRef.path)
          ) {
            transaction.delete(lockRef);
          }
        }
      }

      for (let index = 0; index < reservedSlots.length; index += 1) {
        transaction.set(lockRefs[index], {
          fieldId: data.facilityId,
          date,
          timeSlot: reservedSlots[index],
          bookingGroupId: bookingRef.id,
          ownerUid: uid,
          status: "pending",
          createdAt: now,
        });
      }

      transaction.create(bookingRef, {
        fieldId: data.facilityId,
        facilityName: field.name,
        location: field.neighborhood,
        date,
        timeSlot: startTime,
        endTime,
        reservedSlots,
        durationHours,
        hourlyPriceEtb: field.hourlyPriceEtb,
        totalPriceEtb,
        pricePending: false,
        customerName,
        customerEmail,
        customerPhone,
        participantCount: playerCount,
        invitedPlayers: [],
        participants: [
          {
            userId: uid,
            name: customerName,
            phone: customerPhone,
            role: "organizer",
            paymentStatus: "unpaid",
            amountOwedEtb: totalPriceEtb / playerCount,
          },
        ],
        ownerUid: uid,
        status: "pending_payment",
        paymentStatus: "unpaid",
        paymentExpiresAt: expiresAt,
        createdAt: now,
      });
    });

    const snapshot = await bookingRef.get();
    return {
      ...bookingSummary(bookingRef.id, snapshot.data()),
      reused,
    };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    logger.error("createBooking failed", { code: error?.code });
    throw new HttpsError("internal", "We could not reserve that time. Please try again.");
  }
});

export const initiateChapaPayment = onCall(
  {
    region: FUNCTION_REGION,
    secrets: [chapaSecretKey],
  },
  async (request) => {
    const uid = requireAuth(request);
    const bookingId = request.data?.bookingId;
    if (typeof bookingId !== "string" || bookingId.length < 8) {
      throw new HttpsError("invalid-argument", "Booking reference is missing.");
    }

    const bookingRef = db.collection("bookingGroups").doc(bookingId);
    const txRef = `DSF-${crypto.randomUUID()}`;
    const attemptRef = db.collection("paymentAttempts").doc(txRef);
    const now = Timestamp.now();
    let checkoutUrl = null;
    let shouldInitialize = false;

    try {
      await db.runTransaction(async (transaction) => {
        const bookingSnap = await transaction.get(bookingRef);
        if (!bookingSnap.exists) throw new HttpsError("not-found", "Booking not found.");
        const booking = bookingSnap.data();
        if (booking.ownerUid !== uid) {
          throw new HttpsError("permission-denied", "This booking belongs to another customer.");
        }
        if (
          booking.status !== "pending_payment" ||
          !Number.isFinite(booking.totalPriceEtb) ||
          booking.totalPriceEtb <= 0 ||
          toMillis(booking.paymentExpiresAt) <= now.toMillis()
        ) {
          throw new HttpsError(
            "failed-precondition",
            "This reservation is expired or is no longer awaiting payment.",
          );
        }

        const locks = await Promise.all(
          reservationRefs({ ...booking, id: bookingId }).map((ref) =>
            transaction.get(ref),
          ),
        );
        if (!activePaymentLocks({ ...booking, id: bookingId }, locks)) {
          throw new HttpsError(
            "failed-precondition",
            "The reservation no longer owns every selected time slot.",
          );
        }

        if (booking.activePaymentTxRef) {
          const activeAttemptRef = db
            .collection("paymentAttempts")
            .doc(booking.activePaymentTxRef);
          const activeAttemptSnap = await transaction.get(activeAttemptRef);
          if (activeAttemptSnap.exists) {
            const activeAttempt = activeAttemptSnap.data();
            if (activeAttempt.status === "initiated" && activeAttempt.checkoutUrl) {
              checkoutUrl = activeAttempt.checkoutUrl;
              return;
            }
            if (activeAttempt.status === "initializing") {
              throw new HttpsError(
                "aborted",
                "Payment setup is still in progress. Try again in a moment.",
              );
            }
          }
          transaction.update(bookingRef, {
            activePaymentTxRef: FieldValue.delete(),
          });
        }

        transaction.create(attemptRef, {
          txRef,
          bookingId,
          ownerUid: uid,
          amountEtb: booking.totalPriceEtb,
          currency: "ETB",
          provider: "chapa",
          status: "initializing",
          createdAt: now,
        });
        transaction.update(bookingRef, {
          activePaymentTxRef: txRef,
          paymentStatus: "processing",
        });
        shouldInitialize = true;
      });
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error("Payment setup transaction failed", { bookingId, code: error?.code });
      throw new HttpsError("internal", "We could not start payment. Please try again.");
    }

    if (!shouldInitialize) return { checkoutUrl };

    try {
      const bookingSnap = await bookingRef.get();
      const booking = bookingSnap.data();
      const secret = getChapaSecret();
      const baseUrl = appBaseUrl.value().replace(/\/+$/, "");
      const parsedBaseUrl = new URL(baseUrl);
      if (
        parsedBaseUrl.protocol !== "https:" &&
        !["localhost", "127.0.0.1"].includes(parsedBaseUrl.hostname)
      ) {
        throw new HttpsError(
          "failed-precondition",
          "APP_BASE_URL must use HTTPS outside local development.",
        );
      }
      const callbackUrl = `https://${FUNCTION_REGION}-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/chapaWebhook`;
      const nameParts = booking.customerName.split(/\s+/);
      const response = await fetch(`${providerApi}/transaction/initialize`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: String(booking.totalPriceEtb),
          currency: "ETB",
          email: booking.customerEmail,
          first_name: nameParts[0],
          last_name: nameParts.slice(1).join(" ") || nameParts[0],
          phone_number: booking.customerPhone,
          tx_ref: txRef,
          callback_url: callbackUrl,
          return_url: `${baseUrl}/payment-return?bookingId=${encodeURIComponent(bookingId)}&tx_ref=${encodeURIComponent(txRef)}`,
          customization: {
            title: "Dire Sport Fields",
            description: `${booking.facilityName} booking`,
          },
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const result = await response.json();
      const url = result?.data?.checkout_url;
      if (!response.ok || result?.status !== "success" || typeof url !== "string") {
        throw new Error("Chapa did not return a checkout link.");
      }
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== "https:" || parsedUrl.hostname !== "checkout.chapa.co") {
        throw new Error("Chapa returned an unexpected checkout URL.");
      }

      await db.runTransaction(async (transaction) => {
        const [currentBookingSnap, attemptSnap] = await Promise.all([
          transaction.get(bookingRef),
          transaction.get(attemptRef),
        ]);
        if (!attemptSnap.exists) return;
        if (attemptSnap.data().status !== "initializing") return;
        transaction.update(attemptRef, {
          status: "initiated",
          checkoutUrl: parsedUrl.toString(),
          initializedAt: Timestamp.now(),
        });
        if (
          currentBookingSnap.exists &&
          currentBookingSnap.data().activePaymentTxRef === txRef
        ) {
          transaction.update(bookingRef, {
            activePaymentCheckoutUrl: parsedUrl.toString(),
          });
        }
      });
      return { checkoutUrl: parsedUrl.toString() };
    } catch (error) {
      logger.error("Chapa initialization failed", { bookingId, txRef });
      await db.runTransaction(async (transaction) => {
        const [currentBookingSnap, attemptSnap] = await Promise.all([
          transaction.get(bookingRef),
          transaction.get(attemptRef),
        ]);
        if (attemptSnap.exists && attemptSnap.data().status === "initializing") {
          transaction.update(attemptRef, {
            status: "failed",
            failureReason: "Payment provider initialization failed",
            failedAt: Timestamp.now(),
          });
        }
        if (
          currentBookingSnap.exists &&
          currentBookingSnap.data().activePaymentTxRef === txRef
        ) {
          transaction.update(bookingRef, {
            paymentStatus: "failed",
            activePaymentTxRef: FieldValue.delete(),
            activePaymentCheckoutUrl: FieldValue.delete(),
          });
        }
      });
      if (error instanceof HttpsError) throw error;
      throw new HttpsError(
        "unavailable",
        "We could not connect to Chapa. Your reservation remains available for retry until its deadline.",
      );
    }
  },
);

async function verifyChapaTransaction(txRef) {
  const attemptRef = db.collection("paymentAttempts").doc(txRef);
  const attemptSnap = await attemptRef.get();
  if (!attemptSnap.exists) return { ignored: true };
  const attempt = attemptSnap.data();
  if (attempt.status === "paid" || attempt.status === "paid_late" || attempt.status === "review_required") {
    return { ignored: true };
  }

  const response = await fetch(
    `${providerApi}/transaction/verify/${encodeURIComponent(txRef)}`,
    {
      headers: { Authorization: `Bearer ${getChapaSecret()}` },
      signal: AbortSignal.timeout(15_000),
    },
  );
  const verification = await response.json();
  if (!response.ok) throw new Error("Chapa verification request failed.");

  const bookingRef = db.collection("bookingGroups").doc(attempt.bookingId);
  const paymentReviewRef = db.collection("paymentReviews").doc(txRef);
  const attemptResult = await db.runTransaction(async (transaction) => {
    const [currentAttemptSnap, bookingSnap] = await Promise.all([
      transaction.get(attemptRef),
      transaction.get(bookingRef),
    ]);
    if (!currentAttemptSnap.exists || !bookingSnap.exists) return "ignored";
    const currentAttempt = currentAttemptSnap.data();
    const booking = bookingSnap.data();
    if (
      currentAttempt.status === "paid" ||
      currentAttempt.status === "paid_late" ||
      currentAttempt.status === "review_required"
    ) {
      return "ignored";
    }

    const refs = reservationRefs({ ...booking, id: attempt.bookingId });
    const locks = await Promise.all(refs.map((ref) => transaction.get(ref)));
    const matches = activePaymentLocks(
      { ...booking, id: attempt.bookingId },
      locks,
    );
    const disposition = getPaymentDisposition({
      booking,
      attempt: currentAttempt,
      verification,
      now: Date.now(),
      reservationsMatch: matches,
    });
    const verifiedData = verification?.data ?? {};
    const verifiedPaid =
      verification?.status === "success" && verifiedData.status === "success";
    const paymentTimestamp = Timestamp.now();

    if (disposition.type === "failed") {
      transaction.update(attemptRef, {
        status: "failed",
        failedAt: paymentTimestamp,
      });
      if (booking.activePaymentTxRef === txRef) {
        transaction.update(bookingRef, {
          paymentStatus: "failed",
          activePaymentTxRef: FieldValue.delete(),
          activePaymentCheckoutUrl: FieldValue.delete(),
        });
      }
      return "failed";
    }
    if (disposition.type === "pending") return "pending";

    const safeMatch =
      verifiedPaid &&
      verifiedData.tx_ref === currentAttempt.txRef &&
      verifiedData.currency === currentAttempt.currency &&
      Number.isFinite(Number(verifiedData.amount)) &&
      Number(verifiedData.amount) === currentAttempt.amountEtb;

    if (disposition.type === "confirm" && safeMatch) {
      transaction.update(attemptRef, {
        status: "paid",
        verifiedAt: paymentTimestamp,
        providerReference: verifiedData.reference ?? null,
      });
      transaction.update(bookingRef, {
        status: "confirmed",
        paymentStatus: "paid",
        paidAt: paymentTimestamp,
        activePaymentTxRef: FieldValue.delete(),
        activePaymentCheckoutUrl: FieldValue.delete(),
      });
      refs.forEach((ref) => transaction.update(ref, { status: "confirmed" }));
      return "confirmed";
    }

    const reason = safeMatch
      ? disposition.reason
      : "Verified payment amount, currency, or transaction reference did not match.";
    transaction.update(attemptRef, {
      status: safeMatch ? "paid_late" : "review_required",
      verifiedAt: paymentTimestamp,
      providerReference: verifiedData.reference ?? null,
      reviewReason: reason,
    });
    if (
      booking.status === "pending_payment" ||
      booking.paymentStatus !== "paid"
    ) {
      transaction.update(bookingRef, {
        status:
          booking.status === "pending_payment" ? "expired" : booking.status,
        paymentStatus: verifiedPaid ? "paid" : "failed",
        expiredAt:
          booking.status === "pending_payment" ? paymentTimestamp : booking.expiredAt,
        refundStatus: "manual_review",
        paymentReviewReason: reason,
        activePaymentTxRef: FieldValue.delete(),
        activePaymentCheckoutUrl: FieldValue.delete(),
      });
    }
    if (booking.status !== "confirmed") {
      refs.forEach((ref, index) => {
        if (
          locks[index].exists &&
          locks[index].data().bookingGroupId === attempt.bookingId
        ) {
          transaction.delete(ref);
        }
      });
    }
    transaction.set(paymentReviewRef, {
      bookingId: attempt.bookingId,
      txRef,
      ownerUid: currentAttempt.ownerUid,
      status: "manual_review",
      reason,
      provider: "chapa",
      amountEtb: Number(verifiedData.amount) || currentAttempt.amountEtb,
      currency: String(verifiedData.currency ?? currentAttempt.currency),
      createdAt: paymentTimestamp,
      refundStatus: "manual_review",
    });
    return "review";
  });

  return { status: attemptResult };
}

export const chapaWebhook = onRequest(
  {
    region: FUNCTION_REGION,
    secrets: [chapaSecretKey, chapaWebhookSecret],
  },
  async (request, response) => {
    if (request.method !== "POST") {
      response.status(405).send("Method not allowed");
      return;
    }
    const configuredHash = chapaWebhookSecret.value();
    const signature =
      request.get("x-chapa-signature-v1") ??
      request.get("x-chapa-signature");
    if (!configuredHash || !signature) {
      response.status(401).send("Invalid webhook signature");
      return;
    }
    const expected = crypto
      .createHmac("sha256", configuredHash)
      .update(request.rawBody)
      .digest("hex");
    const actualBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      actualBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
    ) {
      response.status(401).send("Invalid webhook signature");
      return;
    }

    const txRef =
      request.body?.data?.tx_ref ??
      request.body?.tx_ref ??
      request.query?.tx_ref;
    if (typeof txRef !== "string" || !/^DSF-[0-9a-f-]{36}$/i.test(txRef)) {
      response.status(400).send("Invalid transaction reference");
      return;
    }
    try {
      await verifyChapaTransaction(txRef);
      response.status(200).send("ok");
    } catch {
      logger.error("Chapa webhook verification failed", { txRef });
      response.status(503).send("Verification temporarily unavailable");
    }
  },
);

export const getBookingPaymentStatus = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const uid = requireAuth(request);
    const bookingId = request.data?.bookingId;
    if (typeof bookingId !== "string" || bookingId.length < 8) {
      throw new HttpsError("invalid-argument", "Booking reference is missing.");
    }
    const snapshot = await db.collection("bookingGroups").doc(bookingId).get();
    if (!snapshot.exists) throw new HttpsError("not-found", "Booking not found.");
    const booking = snapshot.data();
    if (booking.ownerUid !== uid) {
      throw new HttpsError("permission-denied", "This booking belongs to another customer.");
    }
    return bookingSummary(snapshot.id, booking);
  },
);

export const refreshBookingPayment = onCall(
  {
    region: FUNCTION_REGION,
    secrets: [chapaSecretKey],
  },
  async (request) => {
    const uid = requireAuth(request);
    const { bookingId, txRef } = request.data ?? {};
    if (
      typeof bookingId !== "string" ||
      typeof txRef !== "string" ||
      !/^DSF-[0-9a-f-]{36}$/i.test(txRef)
    ) {
      throw new HttpsError("invalid-argument", "Invalid payment reference.");
    }
    const [bookingSnapshot, attemptSnapshot] = await Promise.all([
      db.collection("bookingGroups").doc(bookingId).get(),
      db.collection("paymentAttempts").doc(txRef).get(),
    ]);
    if (!bookingSnapshot.exists || !attemptSnapshot.exists) {
      throw new HttpsError("not-found", "Payment record not found.");
    }
    if (
      bookingSnapshot.data().ownerUid !== uid ||
      attemptSnapshot.data().ownerUid !== uid ||
      attemptSnapshot.data().bookingId !== bookingId
    ) {
      throw new HttpsError("permission-denied", "This payment belongs to another customer.");
    }
    await verifyChapaTransaction(txRef);
    const updated = await db.collection("bookingGroups").doc(bookingId).get();
    return bookingSummary(updated.id, updated.data());
  },
);

export const cancelPendingBooking = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const uid = requireAuth(request);
    const bookingId = request.data?.bookingId;
    if (typeof bookingId !== "string" || bookingId.length < 8) {
      throw new HttpsError("invalid-argument", "Booking reference is missing.");
    }
    const bookingRef = db.collection("bookingGroups").doc(bookingId);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(bookingRef);
      if (!snapshot.exists) throw new HttpsError("not-found", "Booking not found.");
      const booking = snapshot.data();
      if (booking.ownerUid !== uid) {
        throw new HttpsError("permission-denied", "This booking belongs to another customer.");
      }
      if (
        booking.status !== "pending_payment" ||
        booking.paymentStatus === "paid"
      ) {
        throw new HttpsError(
          "failed-precondition",
          "Only an unpaid reservation can be cancelled here.",
        );
      }
      const refs = reservationRefs({ ...booking, id: bookingId });
      const locks = await Promise.all(refs.map((ref) => transaction.get(ref)));
      transaction.update(bookingRef, {
        status: "cancelled",
        cancelledAt: Timestamp.now(),
        activePaymentTxRef: FieldValue.delete(),
        activePaymentCheckoutUrl: FieldValue.delete(),
      });
      refs.forEach((ref, index) => {
        if (locks[index].exists && locks[index].data().bookingGroupId === bookingId) {
          transaction.delete(ref);
        }
      });
    });
    return { cancelled: true };
  },
);

export const updateRefundStatus = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const admin = requireAdmin(request);
    const { txRef, refundStatus, note } = request.data ?? {};
    if (
      typeof txRef !== "string" ||
      !/^DSF-[0-9a-f-]{36}$/i.test(txRef) ||
      !["manual_review", "processing", "refunded"].includes(refundStatus)
    ) {
      throw new HttpsError("invalid-argument", "Invalid refund update.");
    }
    const reviewRef = db.collection("paymentReviews").doc(txRef);
    const attemptRef = db.collection("paymentAttempts").doc(txRef);
    await db.runTransaction(async (transaction) => {
      const [snapshot, attemptSnapshot] = await Promise.all([
        transaction.get(reviewRef),
        transaction.get(attemptRef),
      ]);
      if (!snapshot.exists || !attemptSnapshot.exists) {
        throw new HttpsError("not-found", "Payment review not found.");
      }
      if (
        snapshot.data().refundStatus === "refunded" &&
        refundStatus !== "refunded"
      ) {
        throw new HttpsError("failed-precondition", "A completed refund cannot be reversed.");
      }
      const updatedAt = Timestamp.now();
      const cleanNote = typeof note === "string" ? note.trim().slice(0, 500) : "";
      transaction.update(reviewRef, {
        refundStatus,
        adminUpdatedAt: updatedAt,
      });
      transaction.set(reviewRef.collection("audit").doc(), {
        adminUid: admin.uid,
        adminEmail: admin.email,
        action: refundStatus,
        note: cleanNote,
        createdAt: updatedAt,
      });
      transaction.update(
        db.collection("bookingGroups").doc(snapshot.data().bookingId),
        {
          refundStatus,
          refundUpdatedAt: updatedAt,
          ...(refundStatus === "refunded" ? { paymentStatus: "refunded" } : {}),
        },
      );
      if (refundStatus === "refunded") {
        transaction.update(attemptRef, {
          status: "refunded",
          refundedAt: updatedAt,
        });
      }
      writeAdminActivity(
        transaction,
        admin,
        "update_refund_status",
        "payment",
        txRef,
        `${refundStatus}${cleanNote ? ` — ${cleanNote}` : ""}`,
      );
    });
    return { refundStatus };
  },
);

export const expireUnpaidBookings = onSchedule(
  {
    schedule: "every 1 minutes",
    timeZone: "Etc/UTC",
    region: FUNCTION_REGION,
  },
  async () => {
    const now = Timestamp.now();
    const cutoff = Timestamp.fromMillis(now.toMillis() - PAYMENT_WINDOW_MS);
    const [paymentReservations, legacyReservations] = await Promise.all([
      db
        .collection("bookingGroups")
        .where("status", "==", "pending_payment")
        .where("paymentExpiresAt", "<=", now)
        .limit(100)
        .get(),
      db
        .collection("bookingGroups")
        .where("status", "==", "pending")
        .where("createdAt", "<=", cutoff)
        .limit(100)
        .get(),
    ]);
    const candidates = new Map(
      [...paymentReservations.docs, ...legacyReservations.docs].map((snapshot) => [
        snapshot.ref.path,
        snapshot.ref,
      ]),
    );

    await Promise.all(
      [...candidates.values()].map(async (bookingRef) => {
        await db.runTransaction(async (transaction) => {
          const snapshot = await transaction.get(bookingRef);
          if (!snapshot.exists) return;
          const booking = snapshot.data();
          if (!isBookingPaymentExpired(booking, now.toMillis())) return;
          if (booking.paymentStatus === "paid") {
            logger.error("Paid booking remained pending at expiration", {
              bookingId: snapshot.id,
            });
            return;
          }

          const refs = reservationRefs({ ...booking, id: snapshot.id });
          const locks = await Promise.all(refs.map((ref) => transaction.get(ref)));
          transaction.update(bookingRef, {
            status: "expired",
            paymentStatus: "expired",
            paymentExpiresAt:
              toMillis(booking.paymentExpiresAt) > 0
                ? booking.paymentExpiresAt
                : Timestamp.fromMillis(
                    Number.isFinite(toMillis(booking.createdAt))
                      ? toMillis(booking.createdAt) + PAYMENT_WINDOW_MS
                      : now.toMillis(),
                  ),
            expiredAt: now,
            activePaymentTxRef: FieldValue.delete(),
            activePaymentCheckoutUrl: FieldValue.delete(),
          });
          refs.forEach((ref, index) => {
            if (
              locks[index].exists &&
              locks[index].data().bookingGroupId === snapshot.id
            ) {
              transaction.delete(ref);
            }
          });
        });
      }),
    );
  },
);

export const createFacilityRequest = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const uid = requireAuth(request);
    await Promise.all([assertCustomerAllowed(uid), assertBookingsEnabled()]);
    const data = request.data ?? {};
    const phone = normalizeEthiopianPhone(data.customerPhone);
    const date = data.date;
    if (!phone) throw new HttpsError("invalid-argument", "Enter a valid Ethiopian phone number.");
    if (!isValidEatDate(date) || date < eatNowParts().date) {
      throw new HttpsError("invalid-argument", "Choose today or a future date.");
    }

    let customerName;
    let facilityId;
    let facilityName;
    let neighborhood;
    let category;
    let pricingType;
    try {
      customerName = cleanText(data.customerName, { field: "Customer name", min: 2, max: 100 });
      facilityId = cleanText(data.facilityId, { field: "Facility", min: 3, max: 80 });
      facilityName = cleanText(data.facilityName, { field: "Facility name", min: 2, max: 120 });
      neighborhood = cleanText(data.neighborhood, { field: "Neighborhood", min: 2, max: 120 });
      category = cleanText(data.category, { field: "Category", min: 2, max: 30 });
      pricingType = cleanText(data.pricingType, { field: "Pricing type", min: 2, max: 30 });
    } catch (error) {
      throw new HttpsError("invalid-argument", error.message);
    }

    const durationHours = data.durationHours === null || data.durationHours === undefined
      ? null
      : Number(data.durationHours);
    const partySize = data.partySize === null || data.partySize === undefined
      ? null
      : Number(data.partySize);
    if (durationHours !== null && (![1, 2, 3].includes(durationHours))) {
      throw new HttpsError("invalid-argument", "Duration must be 1, 2, or 3 hours.");
    }
    if (partySize !== null && (!Number.isInteger(partySize) || partySize < 1 || partySize > 30)) {
      throw new HttpsError("invalid-argument", "Group size must be between 1 and 30 people.");
    }

    const ref = db.collection("facilityRequests").doc();
    await ref.set({
      facilityId,
      facilityName,
      neighborhood,
      category,
      pricingType,
      plan: typeof data.plan === "string" ? data.plan.trim().slice(0, 120) || null : null,
      date,
      preferredTime:
        typeof data.preferredTime === "string"
          ? data.preferredTime.trim().slice(0, 80) || null
          : null,
      durationHours,
      partySize,
      message: typeof data.message === "string" ? data.message.trim().slice(0, 500) || null : null,
      customerName,
      customerPhone: phone,
      ownerUid: uid,
      status: "pending",
      createdAt: Timestamp.now(),
    });
    return { id: ref.id };
  },
);

export const submitReview = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const uid = requireAuth(request);
    await assertCustomerAllowed(uid);
    let input;
    try {
      input = validateReviewPayload(request.data ?? {});
    } catch (error) {
      throw new HttpsError("invalid-argument", error.message);
    }

    const bookingRef = db.collection("bookingGroups").doc(input.bookingId);
    const reviewRef = db.collection("reviews").doc(input.bookingId);
    await db.runTransaction(async (transaction) => {
      const [bookingSnapshot, reviewSnapshot] = await Promise.all([
        transaction.get(bookingRef),
        transaction.get(reviewRef),
      ]);
      if (!bookingSnapshot.exists) throw new HttpsError("not-found", "Booking not found.");
      const booking = bookingSnapshot.data();
      if (booking.ownerUid !== uid || booking.fieldId !== input.facilityId) {
        throw new HttpsError("permission-denied", "This booking cannot be reviewed by this account.");
      }
      if (booking.status !== "confirmed" || booking.paymentStatus !== "paid") {
        throw new HttpsError("failed-precondition", "Only a confirmed paid booking can be reviewed.");
      }
      if (reviewSnapshot.exists && reviewSnapshot.data().status === "approved") {
        throw new HttpsError("failed-precondition", "An approved review cannot be edited.");
      }
      const now = Timestamp.now();
      const publicReviewId = crypto
        .createHash("sha256")
        .update(input.bookingId)
        .digest("hex")
        .slice(0, 32);
      transaction.set(reviewRef, {
        bookingId: input.bookingId,
        facilityId: input.facilityId,
        facilityName: booking.facilityName,
        ownerUid: uid,
        customerName: booking.customerName,
        rating: input.rating,
        comment: input.comment,
        publicReviewId,
        status: "pending",
        createdAt: reviewSnapshot.exists ? reviewSnapshot.data().createdAt ?? now : now,
        updatedAt: now,
      });
    });
    return { id: reviewRef.id, status: "pending" };
  },
);

export const submitFeedback = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const uid = requireAuth(request);
    await assertCustomerAllowed(uid);
    let input;
    try {
      input = validateFeedbackPayload(request.data ?? {});
    } catch (error) {
      throw new HttpsError("invalid-argument", error.message);
    }
    const ref = db.collection("feedback").doc();
    await ref.set({
      ...input,
      ownerUid: uid,
      status: "new",
      createdAt: Timestamp.now(),
    });
    return { id: ref.id };
  },
);

export const adminCancelBooking = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const admin = requireAdmin(request);
    const bookingId = request.data?.bookingId;
    if (typeof bookingId !== "string" || bookingId.length < 8 || bookingId.length > 128) {
      throw new HttpsError("invalid-argument", "Invalid booking reference.");
    }
    let reason;
    try {
      reason = cleanText(request.data?.reason ?? "Cancelled by administrator", {
        field: "Cancellation reason",
        min: 3,
        max: 500,
      });
    } catch (error) {
      throw new HttpsError("invalid-argument", error.message);
    }

    const bookingRef = db.collection("bookingGroups").doc(bookingId);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(bookingRef);
      if (!snapshot.exists) throw new HttpsError("not-found", "Booking not found.");
      const booking = snapshot.data();
      if (booking.status === "cancelled") return;
      if (booking.status === "confirmed" || booking.paymentStatus === "paid") {
        throw new HttpsError(
          "failed-precondition",
          "A paid or confirmed booking cannot be cancelled from the dashboard.",
        );
      }
      if (!["pending_payment", "pending"].includes(booking.status)) {
        throw new HttpsError(
          "failed-precondition",
          "Only an active unpaid reservation can be cancelled from the dashboard.",
        );
      }
      const refs = Array.isArray(booking.reservedSlots)
        ? reservationRefs({ ...booking, id: bookingId })
        : [];
      const locks = await Promise.all(refs.map((ref) => transaction.get(ref)));
      const now = Timestamp.now();
      transaction.update(bookingRef, {
        status: "cancelled",
        cancellationReason: reason,
        cancelledAt: now,
        cancelledBy: admin.uid,
        activePaymentTxRef: FieldValue.delete(),
        activePaymentCheckoutUrl: FieldValue.delete(),
      });
      refs.forEach((ref, index) => {
        if (locks[index].exists && locks[index].data().bookingGroupId === bookingId) {
          transaction.delete(ref);
        }
      });
      writeAdminActivity(transaction, admin, "cancel_booking", "booking", bookingId, reason);
    });
    return { cancelled: true };
  },
);

export const adminUpdateFacilityRequest = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const admin = requireAdmin(request);
    const { requestId, status } = request.data ?? {};
    if (typeof requestId !== "string" || !["approved", "rejected"].includes(status)) {
      throw new HttpsError("invalid-argument", "Invalid facility request update.");
    }
    const note = typeof request.data?.adminNote === "string"
      ? request.data.adminNote.trim().slice(0, 500)
      : "";
    const ref = db.collection("facilityRequests").doc(requestId);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new HttpsError("not-found", "Facility request not found.");
      if (snapshot.data().status !== "pending") {
        throw new HttpsError("failed-precondition", "This request has already been reviewed.");
      }
      transaction.update(ref, {
        status,
        adminNote: note,
        reviewedAt: Timestamp.now(),
        reviewedBy: admin.uid,
      });
      writeAdminActivity(
        transaction,
        admin,
        `facility_request_${status}`,
        "facility_request",
        requestId,
        note,
      );
    });
    return { status };
  },
);

export const adminUpsertFacility = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const admin = requireAdmin(request);
    let facility;
    try {
      facility = validateFacilityPayload(request.data?.facility ?? {});
    } catch (error) {
      throw new HttpsError("invalid-argument", error.message);
    }
    const source = request.data?.source === "catalog" ? "catalog" : "custom";
    const ref = db.collection("facilities").doc(facility.id);
    let created = false;
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      created = !snapshot.exists;
      const current = snapshot.exists ? snapshot.data() : {};
      const now = Timestamp.now();
      transaction.set(ref, {
        ...facility,
        source: current.source ?? source,
        reviewCount: Number(current.reviewCount) || 0,
        ratingSum: Number(current.ratingSum) || 0,
        rating: Number.isFinite(current.rating) ? current.rating : null,
        createdAt: current.createdAt ?? now,
        updatedAt: now,
        archivedAt: null,
      });
      writeAdminActivity(
        transaction,
        admin,
        created ? "create_facility" : "update_facility",
        "facility",
        facility.id,
        facility.name,
      );
    });
    return { id: facility.id, created };
  },
);

export const adminArchiveFacility = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const admin = requireAdmin(request);
    let facility;
    try {
      facility = validateFacilityPayload(request.data?.facility ?? {});
    } catch (error) {
      throw new HttpsError("invalid-argument", error.message);
    }
    const ref = db.collection("facilities").doc(facility.id);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      const current = snapshot.exists ? snapshot.data() : {};
      const now = Timestamp.now();
      transaction.set(ref, {
        ...facility,
        source: current.source ?? request.data?.source ?? "catalog",
        isPublished: false,
        availability: "unavailable",
        reviewCount: Number(current.reviewCount) || 0,
        ratingSum: Number(current.ratingSum) || 0,
        rating: Number.isFinite(current.rating) ? current.rating : null,
        createdAt: current.createdAt ?? now,
        updatedAt: now,
        archivedAt: now,
      });
      writeAdminActivity(
        transaction,
        admin,
        "archive_facility",
        "facility",
        facility.id,
        facility.name,
      );
    });
    return { id: facility.id, archived: true };
  },
);

export const adminModerateReview = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const admin = requireAdmin(request);
    const { reviewId, status } = request.data ?? {};
    if (typeof reviewId !== "string" || !["approved", "rejected"].includes(status)) {
      throw new HttpsError("invalid-argument", "Invalid review moderation action.");
    }
    const note = typeof request.data?.adminNote === "string"
      ? request.data.adminNote.trim().slice(0, 500)
      : "";
    const reviewRef = db.collection("reviews").doc(reviewId);
    await db.runTransaction(async (transaction) => {
      const reviewSnapshot = await transaction.get(reviewRef);
      if (!reviewSnapshot.exists) throw new HttpsError("not-found", "Review not found.");
      const review = reviewSnapshot.data();
      const facilityRef = db.collection("facilities").doc(review.facilityId);
      const publicReviewId =
        review.publicReviewId ??
        crypto.createHash("sha256").update(reviewId).digest("hex").slice(0, 32);
      const publicReviewRef = db.collection("publicReviews").doc(publicReviewId);
      const facilitySnapshot = await transaction.get(facilityRef);
      const facility = facilitySnapshot.exists ? facilitySnapshot.data() : {};
      let reviewCount = Number(facility.reviewCount) || 0;
      let ratingSum = Number(facility.ratingSum) || 0;
      if (review.status === "approved" && status !== "approved") {
        reviewCount = Math.max(0, reviewCount - 1);
        ratingSum = Math.max(0, ratingSum - Number(review.rating || 0));
      } else if (review.status !== "approved" && status === "approved") {
        reviewCount += 1;
        ratingSum += Number(review.rating || 0);
      }
      const now = Timestamp.now();
      transaction.update(reviewRef, {
        status,
        publicReviewId,
        adminNote: note,
        moderatedAt: now,
        moderatedBy: admin.uid,
      });
      transaction.set(
        facilityRef,
        {
          reviewCount,
          ratingSum,
          rating: reviewCount > 0 ? ratingSum / reviewCount : null,
          ratingUpdatedAt: now,
        },
        { merge: true },
      );
      if (status === "approved") {
        transaction.set(publicReviewRef, {
          facilityId: review.facilityId,
          facilityName: review.facilityName,
          customerName: review.customerName,
          rating: review.rating,
          comment: review.comment,
          publishedAt: now,
        });
      } else {
        transaction.delete(publicReviewRef);
      }
      writeAdminActivity(
        transaction,
        admin,
        `review_${status}`,
        "review",
        reviewId,
        note,
      );
    });
    return { status };
  },
);

export const adminUpdateFeedback = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const admin = requireAdmin(request);
    const { feedbackId, status } = request.data ?? {};
    if (typeof feedbackId !== "string" || !["new", "read", "resolved"].includes(status)) {
      throw new HttpsError("invalid-argument", "Invalid feedback update.");
    }
    const note = typeof request.data?.adminNote === "string"
      ? request.data.adminNote.trim().slice(0, 500)
      : "";
    const ref = db.collection("feedback").doc(feedbackId);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new HttpsError("not-found", "Feedback not found.");
      transaction.update(ref, {
        status,
        adminNote: note,
        updatedAt: Timestamp.now(),
        updatedBy: admin.uid,
      });
      writeAdminActivity(transaction, admin, "update_feedback", "feedback", feedbackId, status);
    });
    return { status };
  },
);

export const adminCreateNotification = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const admin = requireAdmin(request);
    let notification;
    try {
      notification = validateNotificationPayload(request.data ?? {});
    } catch (error) {
      throw new HttpsError("invalid-argument", error.message);
    }
    const ref = db.collection("adminNotifications").doc();
    const activityRef = db.collection("adminActivityLog").doc();
    const now = Timestamp.now();
    const batch = db.batch();
    batch.set(ref, {
      ...notification,
      createdAt: now,
      publishedAt: notification.status === "published" ? now : null,
    });
    batch.set(
      activityRef,
      adminActivity(
        admin,
        notification.status === "published" ? "publish_notification" : "create_notification_draft",
        "notification",
        ref.id,
        notification.title,
      ),
    );
    await batch.commit();
    return { id: ref.id, status: notification.status };
  },
);

export const adminUpdateNotification = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const admin = requireAdmin(request);
    const notificationId = request.data?.notificationId;
    if (typeof notificationId !== "string") {
      throw new HttpsError("invalid-argument", "Invalid notification.");
    }
    let notification;
    try {
      notification = validateNotificationPayload(request.data?.notification ?? {});
    } catch (error) {
      throw new HttpsError("invalid-argument", error.message);
    }
    const ref = db.collection("adminNotifications").doc(notificationId);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new HttpsError("not-found", "Notification not found.");
      if (snapshot.data().status === "archived") {
        throw new HttpsError("failed-precondition", "An archived notification cannot be republished.");
      }
      const now = Timestamp.now();
      transaction.update(ref, {
        ...notification,
        updatedAt: now,
        publishedAt:
          notification.status === "published"
            ? snapshot.data().publishedAt ?? now
            : null,
      });
      writeAdminActivity(
        transaction,
        admin,
        notification.status === "published" ? "publish_notification" : "update_notification",
        "notification",
        notificationId,
        notification.title,
      );
    });
    return { id: notificationId, status: notification.status };
  },
);

export const adminArchiveNotification = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const admin = requireAdmin(request);
    const notificationId = request.data?.notificationId;
    if (typeof notificationId !== "string") {
      throw new HttpsError("invalid-argument", "Invalid notification.");
    }
    const ref = db.collection("adminNotifications").doc(notificationId);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new HttpsError("not-found", "Notification not found.");
      transaction.update(ref, {
        status: "archived",
        archivedAt: Timestamp.now(),
        archivedBy: admin.uid,
      });
      writeAdminActivity(
        transaction,
        admin,
        "archive_notification",
        "notification",
        notificationId,
        snapshot.data().title,
      );
    });
    return { archived: true };
  },
);

export const adminUpdateCustomer = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const admin = requireAdmin(request);
    const { customerUid, status } = request.data ?? {};
    if (
      typeof customerUid !== "string" ||
      customerUid.length < 1 ||
      customerUid.length > 128 ||
      !["active", "blocked"].includes(status)
    ) {
      throw new HttpsError("invalid-argument", "Invalid customer update.");
    }
    const note = typeof request.data?.adminNote === "string"
      ? request.data.adminNote.trim().slice(0, 1_000)
      : "";
    const ref = db.collection("customerAdmin").doc(customerUid);
    const activityRef = db.collection("adminActivityLog").doc();
    const now = Timestamp.now();
    const batch = db.batch();
    batch.set(
      ref,
      {
        status,
        adminNote: note,
        updatedAt: now,
        updatedBy: admin.uid,
      },
      { merge: true },
    );
    batch.set(
      activityRef,
      adminActivity(admin, "update_customer_status", "customer", customerUid, status),
    );
    await batch.commit();
    return { status };
  },
);

export const adminUpdateProfile = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const admin = requireAdmin(request);
    let displayName;
    let phone;
    try {
      displayName = cleanText(request.data?.displayName, {
        field: "Display name",
        min: 2,
        max: 100,
      });
      phone = typeof request.data?.phone === "string"
        ? request.data.phone.trim().slice(0, 40)
        : "";
    } catch (error) {
      throw new HttpsError("invalid-argument", error.message);
    }
    await getAuth(app).updateUser(admin.uid, { displayName });
    const profileRef = db.collection("adminProfiles").doc(admin.uid);
    const activityRef = db.collection("adminActivityLog").doc();
    const now = Timestamp.now();
    const batch = db.batch();
    batch.set(
      profileRef,
      {
        displayName,
        phone,
        email: admin.email,
        updatedAt: now,
      },
      { merge: true },
    );
    batch.set(
      activityRef,
      adminActivity(admin, "update_admin_profile", "admin", admin.uid, displayName),
    );
    await batch.commit();
    return { displayName, phone };
  },
);

export const adminUpdateSettings = onCall(
  { region: FUNCTION_REGION },
  async (request) => {
    const admin = requireAdmin(request);
    let platformName;
    let supportEmail;
    let supportPhone;
    let maintenanceMessage;
    try {
      platformName = cleanText(request.data?.platformName ?? "Dire Sport Fields", {
        field: "Platform name",
        min: 2,
        max: 80,
      });
      supportEmail = String(request.data?.supportEmail ?? "").trim().toLowerCase().slice(0, 254);
      supportPhone = String(request.data?.supportPhone ?? "").trim().slice(0, 40);
      maintenanceMessage = String(request.data?.maintenanceMessage ?? "").trim().slice(0, 500);
    } catch (error) {
      throw new HttpsError("invalid-argument", error.message);
    }
    if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
      throw new HttpsError("invalid-argument", "Enter a valid support email address.");
    }
    if (typeof request.data?.bookingEnabled !== "boolean") {
      throw new HttpsError("invalid-argument", "Booking availability is invalid.");
    }
    const settingsRef = db.collection("platformSettings").doc("general");
    const activityRef = db.collection("adminActivityLog").doc();
    const now = Timestamp.now();
    const batch = db.batch();
    batch.set(
      settingsRef,
      {
        platformName,
        supportEmail,
        supportPhone,
        maintenanceMessage,
        bookingEnabled: request.data.bookingEnabled,
        updatedAt: now,
      },
      { merge: true },
    );
    batch.set(
      activityRef,
      adminActivity(
        admin,
        "update_platform_settings",
        "settings",
        "general",
        request.data.bookingEnabled ? "Bookings enabled" : "Bookings paused",
      ),
    );
    await batch.commit();
    return { updated: true };
  },
);
