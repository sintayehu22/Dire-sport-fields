import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export class PaymentError extends Error {
  constructor(message, code = "PAYMENT_FAILED") {
    super(message);
    this.name = "PaymentError";
    this.code = code;
  }
}

async function callPaymentFunction(name, data) {
  if (!functions) {
    throw new PaymentError(
      "The payment service is not configured.",
      "FIREBASE_NOT_CONFIGURED",
    );
  }

  try {
    const invoke = httpsCallable(functions, name);
    return (await invoke(data)).data;
  } catch (error) {
    throw new PaymentError(
      error?.message ?? "The payment request failed. Please try again.",
      error?.code ?? "NETWORK",
    );
  }
}

export function initiateChapaPayment(bookingId) {
  return callPaymentFunction("initiateChapaPayment", { bookingId });
}

export function getBookingPaymentStatus(bookingId) {
  return callPaymentFunction("getBookingPaymentStatus", { bookingId });
}

export function refreshBookingPayment(bookingId, txRef) {
  return callPaymentFunction("refreshBookingPayment", { bookingId, txRef });
}

export function cancelBooking({ bookingId }) {
  return callPaymentFunction("cancelPendingBooking", { bookingId });
}

export function updateRefundStatus({ txRef, refundStatus, note }) {
  return callPaymentFunction("updateRefundStatus", {
    txRef,
    refundStatus,
    note,
  });
}
