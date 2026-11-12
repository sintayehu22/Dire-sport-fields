"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getBookingPaymentStatus,
  initiateChapaPayment,
  refreshBookingPayment,
} from "@/src/lib/payments";
import { formatEatTimestamp } from "@/src/lib/eatTime.mjs";

function PaymentReturnContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const txRef = searchParams.get("tx_ref");
  const [booking, setBooking] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    if (!bookingId) return undefined;

    let active = true;
    let inFlight = false;
    let lastVerificationAt = 0;
    let pollTimer;
    const refresh = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        let status = await getBookingPaymentStatus(bookingId);
        if (active) {
          setBooking(status);
          setErrorMessage("");
        }
        if (
          status.status === "pending_payment" &&
          txRef &&
          Date.now() - lastVerificationAt >= 30_000
        ) {
          lastVerificationAt = Date.now();
          status = await refreshBookingPayment(bookingId, txRef);
          if (active) setBooking(status);
        }
        const expiredReviewWindow =
          !txRef ||
          Date.now() >
            (status.paymentExpiresAt ?? 0) + 5 * 60 * 1000;
        if (
          status.status === "confirmed" ||
          (["expired", "cancelled"].includes(status.status) && expiredReviewWindow)
        ) {
          if (active) {
            window.clearInterval(pollTimer);
          }
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error?.message ?? "We could not load your booking status. Please retry.",
          );
        }
      } finally {
        inFlight = false;
      }
    };

    refresh();
    pollTimer = window.setInterval(refresh, 10_000);
    return () => {
      active = false;
      window.clearInterval(pollTimer);
    };
  }, [bookingId, txRef]);

  useEffect(() => {
    if (!booking?.paymentExpiresAt) return undefined;
    const updateCountdown = () => {
      setRemainingSeconds(
        Math.max(0, Math.ceil((booking.paymentExpiresAt - Date.now()) / 1000)),
      );
    };
    updateCountdown();
    const timer = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [booking?.paymentExpiresAt]);

  async function handleRetry() {
    if (!booking?.bookingId || remainingSeconds === 0) return;
    setIsRetrying(true);
    setErrorMessage("");
    try {
      const payment = await initiateChapaPayment(booking.bookingId);
      window.location.assign(payment.checkoutUrl);
    } catch (error) {
      setErrorMessage(error?.message ?? "We could not start payment. Please try again.");
    } finally {
      setIsRetrying(false);
    }
  }

  const isPending = booking?.status === "pending_payment";
  const isConfirmed = booking?.status === "confirmed" && booking?.paymentStatus === "paid";
  const isExpired = booking?.status === "expired" || booking?.status === "cancelled";
  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:${String(remainingSeconds % 60).padStart(2, "0")}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <section className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-9">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">
          Dire Sport Fields
        </p>
        <h1 className="mt-3 text-2xl font-extrabold text-white">
          {isConfirmed
            ? "Payment verified"
            : isExpired
              ? "Reservation expired"
              : "Checking payment"}
        </h1>

        {errorMessage && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-200"
          >
            {errorMessage}
          </p>
        )}

        {booking ? (
          <div className="mt-5 space-y-4">
            <p
              role="status"
              className={`rounded-xl border px-4 py-4 text-sm ${
                isConfirmed
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : isExpired
                    ? "border-amber-400/20 bg-amber-400/10 text-amber-200"
                    : "border-white/10 bg-slate-950/60 text-slate-300"
              }`}
            >
              {isConfirmed
                ? "Payment verified! Your booking is confirmed."
                : isExpired
                  ? "Your reservation has expired because payment was not completed in time. Please select another available time."
                  : "Your time slot is temporarily reserved. Complete payment within 30 minutes. This page checks payment with the server; a return from checkout alone does not confirm the booking."}
            </p>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-white/10 bg-slate-950/50 p-4 text-sm">
              <dt className="text-slate-500">Booking reference</dt>
              <dd className="break-all text-right font-semibold text-slate-200">
                {booking.bookingId}
              </dd>
              <dt className="text-slate-500">Facility</dt>
              <dd className="text-right font-semibold text-slate-200">
                {booking.facilityName}
              </dd>
              <dt className="text-slate-500">Date and time</dt>
              <dd className="text-right font-semibold text-slate-200">
                {booking.bookingDate} · {booking.startTime}–{booking.endTime} EAT
              </dd>
              <dt className="text-slate-500">Duration</dt>
              <dd className="text-right font-semibold text-slate-200">
                {booking.durationHours} hour{booking.durationHours === 1 ? "" : "s"}
              </dd>
              <dt className="text-slate-500">Amount</dt>
              <dd className="text-right font-semibold text-white">
                {booking.totalPriceEtb?.toLocaleString("en-US")} {booking.currency}
              </dd>
              <dt className="text-slate-500">Payment status</dt>
              <dd className="text-right font-semibold capitalize text-slate-200">
                {booking.paymentStatus?.replaceAll("_", " ")}
              </dd>
              {isPending && (
                <>
                  <dt className="text-slate-500">Payment deadline</dt>
                  <dd className="text-right font-semibold text-slate-200">
                    {formatEatTimestamp(new Date(booking.paymentExpiresAt))}
                    <span className="mt-1 block tabular-nums text-emerald-300">
                      {remainingSeconds > 0 ? countdown : "Expired"}
                    </span>
                  </dd>
                </>
              )}
            </dl>

            {isPending && remainingSeconds > 0 && (
              <button
                type="button"
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRetrying ? "Opening secure checkout..." : "Continue payment"}
              </button>
            )}

            {booking.refundStatus === "manual_review" && (
              <p className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                Your payment needs manual review. The booking has not been confirmed.
                Please contact the facility before making another payment.
              </p>
            )}
          </div>
        ) : bookingId && !errorMessage ? (
          <p className="mt-4 text-sm text-slate-400">
            Verifying the booking status with the server…
          </p>
        ) : !bookingId ? (
          <p role="alert" className="mt-4 text-sm text-red-300">
            The booking reference is missing from this payment return.
          </p>
        ) : null}

        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400/50 hover:text-emerald-300"
        >
          Return to facilities
        </Link>
      </section>
    </main>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
          Checking payment…
        </main>
      }
    >
      <PaymentReturnContent />
    </Suspense>
  );
}
