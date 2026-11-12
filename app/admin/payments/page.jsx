"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAllBookings,
  getAllPaymentAttempts,
  getAllPaymentReviews,
  updateRefundStatus,
} from "@/src/lib/admin";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  MetricCard,
  PageHeader,
  Panel,
  StatusPill,
  SuccessBanner,
  formatAdminTime,
  formatMoney,
  inputClass,
  shortId,
} from "@/src/components/admin/AdminUi";

export default function AdminPaymentsPage() {
  const [bookings, setBookings] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState("reviews");
  const [queryText, setQueryText] = useState("");
  const [status, setStatus] = useState("all");
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      const [bookingData, attemptData, reviewData] = await Promise.all([
        getAllBookings({ pageSize: 1_000 }),
        getAllPaymentAttempts({ pageSize: 1_000 }),
        getAllPaymentReviews({ pageSize: 1_000 }),
      ]);
      setBookings(bookingData);
      setAttempts(attemptData);
      setReviews(reviewData);
    } catch (nextError) {
      setError(nextError?.message ?? "Payment records could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const successful = attempts.filter((item) => item.status === "paid");
  const refunded = attempts.filter((item) => item.status === "refunded");
  const needsReview = reviews.filter((item) => item.refundStatus === "manual_review");
  const collected = bookings.filter((item) => item.paymentStatus === "paid").reduce((sum, item) => sum + (Number(item.totalPriceEtb) || 0), 0);
  const refundedAmount = reviews.filter((item) => item.refundStatus === "refunded").reduce((sum, item) => sum + (Number(item.amountEtb) || 0), 0);

  const filtered = useMemo(() => {
    const records = tab === "reviews" ? reviews : tab === "attempts" ? attempts : bookings;
    const search = queryText.trim().toLowerCase();
    return records.filter((record) => {
      const recordStatus = tab === "reviews" ? record.refundStatus : tab === "bookings" ? record.paymentStatus : record.status;
      if (status !== "all" && recordStatus !== status) return false;
      if (search && ![record.id, record.txRef, record.bookingId, record.customerName, record.customerEmail, record.facilityName, record.providerReference].join(" ").toLowerCase().includes(search)) return false;
      return true;
    });
  }, [attempts, bookings, reviews, tab, queryText, status]);

  async function handleRefundUpdate(review, refundStatus) {
    if (refundStatus === "refunded" && !window.confirm("Confirm only after the refund is complete in Chapa. This action cannot be reversed in the dashboard.")) return;
    setUpdating(review.id);
    setError("");
    setSuccess("");
    try {
      await updateRefundStatus({ txRef: review.id, refundStatus, note: notes[review.id] ?? "" });
      setReviews((current) => current.map((item) => item.id === review.id ? { ...item, refundStatus, adminUpdatedAt: new Date() } : item));
      if (refundStatus === "refunded") {
        setAttempts((current) => current.map((item) => item.id === review.id ? { ...item, status: "refunded" } : item));
        setBookings((current) => current.map((item) => item.id === review.bookingId ? { ...item, paymentStatus: "refunded", refundStatus } : item));
      }
      setSuccess(refundStatus === "refunded" ? "Refund completion was recorded. The provider refund itself was not issued by this dashboard." : "The reconciliation status was updated.");
    } catch (nextError) {
      setError(nextError?.message ?? "The refund record could not be updated.");
    } finally {
      setUpdating("");
    }
  }

  if (loading && attempts.length === 0 && reviews.length === 0) return <LoadingState label="Loading payment and reconciliation records…" />;

  const statusOptions = tab === "reviews"
    ? ["manual_review", "processing", "refunded"]
    : tab === "attempts"
      ? ["initializing", "initiated", "paid", "paid_late", "review_required", "failed", "refunded"]
      : ["unpaid", "processing", "paid", "failed", "expired", "refunded"];

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Payment management" title="Payments and reconciliation" description="Monitor Chapa attempts, booking payment states, late or mismatched payments, and manual refund records. The dashboard never treats a redirect or an administrator click as proof of payment." actions={<button type="button" onClick={load} disabled={loading} className="min-h-10 rounded-xl border border-white/10 px-4 text-xs font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button>} />
      <ErrorBanner message={error} onRetry={load} />
      <SuccessBanner message={success} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Collected revenue" value={formatMoney(collected)} detail="Current paid bookings" color="emerald" symbol="ETB" />
        <MetricCard label="Successful attempts" value={successful.length} detail="Provider-verified attempts" color="emerald" symbol="✓" />
        <MetricCard label="Needs review" value={needsReview.length} detail="Late or mismatched payments" color="rose" symbol="!" />
        <MetricCard label="Refunded attempts" value={refunded.length} detail={formatMoney(refundedAmount)} color="violet" symbol="↩" />
        <MetricCard label="All attempts" value={attempts.length} detail="Every stored Chapa attempt" color="blue" symbol="P" />
      </section>

      <Panel>
        <div className="flex flex-col gap-4 p-4 xl:flex-row xl:items-center">
          <div className="flex flex-wrap gap-2">
            {[["reviews", `Review queue (${reviews.length})`], ["attempts", `Payment attempts (${attempts.length})`], ["bookings", `Booking payments (${bookings.length})`]].map(([key, label]) => <button key={key} type="button" onClick={() => { setTab(key); setStatus("all"); }} className={`min-h-10 rounded-xl border px-4 text-xs font-bold transition ${tab === key ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-white/10 text-slate-400 hover:bg-white/5 hover:text-white"}`}>{label}</button>)}
          </div>
          <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_14rem] xl:ml-auto xl:max-w-2xl">
            <input type="search" value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="Search transaction, booking, customer…" className={inputClass} />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}><option value="all">All statuses</option>{statusOptions.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select>
          </div>
        </div>
      </Panel>

      {tab === "reviews" && (
        <Panel title={`${filtered.length} reconciliation record${filtered.length === 1 ? "" : "s"}`} description="Complete refunds in Chapa first, then record the operational status here.">
          {filtered.length === 0 ? <EmptyState title="No payment reviews match" description="Late or mismatched verified payments will appear here automatically." /> : <div className="grid gap-4 p-4 lg:grid-cols-2">{filtered.map((review) => <article key={review.id} className="rounded-2xl border border-white/[0.08] bg-[#091510] p-5"><div className="flex items-start justify-between gap-3"><div><p className="break-all font-mono text-xs font-bold text-white">{review.id}</p><p className="mt-1 text-[11px] text-slate-600">Booking {shortId(review.bookingId)}</p></div><StatusPill status={review.refundStatus} /></div><p className="mt-4 rounded-xl border border-amber-400/10 bg-amber-400/[0.05] px-3 py-3 text-xs leading-5 text-amber-100/80">{review.reason}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><dt className="text-slate-600">Amount</dt><dd className="mt-1 font-bold text-white">{formatMoney(review.amountEtb)}</dd></div><div><dt className="text-slate-600">Provider</dt><dd className="mt-1 capitalize text-slate-300">{review.provider}</dd></div><div><dt className="text-slate-600">Created</dt><dd className="mt-1 text-slate-400">{formatAdminTime(review.createdAt)}</dd></div><div><dt className="text-slate-600">Currency</dt><dd className="mt-1 text-slate-300">{review.currency}</dd></div></dl><label className="mt-4 block text-xs font-semibold text-slate-400">Reconciliation note<textarea rows={2} value={notes[review.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [review.id]: event.target.value }))} className={`mt-2 py-2 ${inputClass}`} /></label><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={updating === review.id || review.refundStatus === "processing" || review.refundStatus === "refunded"} onClick={() => handleRefundUpdate(review, "processing")} className="min-h-10 rounded-xl border border-amber-400/20 text-[11px] font-bold text-amber-200 hover:bg-amber-400/10 disabled:opacity-40">Refund in progress</button><button type="button" disabled={updating === review.id || review.refundStatus === "refunded"} onClick={() => handleRefundUpdate(review, "refunded")} className="min-h-10 rounded-xl bg-emerald-400 text-[11px] font-extrabold text-[#07110d] hover:bg-emerald-300 disabled:opacity-40">Record refund complete</button></div></article>)}</div>}
        </Panel>
      )}

      {tab === "attempts" && (
        <Panel title={`${filtered.length} payment attempt${filtered.length === 1 ? "" : "s"}`} description="Read-only provider transaction history.">
          {filtered.length === 0 ? <EmptyState title="No payment attempts match" /> : <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-sm"><thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.14em] text-slate-600"><tr><th className="px-5 py-3">Transaction</th><th className="px-4 py-3">Booking</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Provider reference</th><th className="px-4 py-3">Created</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{filtered.map((attempt) => <tr key={attempt.id}><td className="px-5 py-4 font-mono text-xs text-white">{attempt.txRef || attempt.id}</td><td className="px-4 py-4 font-mono text-xs text-slate-500">{shortId(attempt.bookingId)}</td><td className="px-4 py-4 font-semibold text-slate-200">{formatMoney(attempt.amountEtb)}</td><td className="px-4 py-4 text-xs text-slate-500">{attempt.providerReference || "—"}</td><td className="px-4 py-4 text-xs text-slate-500">{formatAdminTime(attempt.createdAt)}</td><td className="px-5 py-4"><StatusPill status={attempt.status} /></td></tr>)}</tbody></table></div>}
        </Panel>
      )}

      {tab === "bookings" && (
        <Panel title={`${filtered.length} booking payment record${filtered.length === 1 ? "" : "s"}`} description="Booking-level payment state derived from verified backend decisions.">
          {filtered.length === 0 ? <EmptyState title="No booking payments match" /> : <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.14em] text-slate-600"><tr><th className="px-5 py-3">Booking</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Facility</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Booking</th><th className="px-5 py-3">Payment</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{filtered.map((booking) => <tr key={booking.id}><td className="px-5 py-4 font-mono text-xs text-slate-500">{shortId(booking.id)}</td><td className="px-4 py-4"><p className="text-slate-300">{booking.customerName}</p><p className="text-[11px] text-slate-600">{booking.customerEmail}</p></td><td className="px-4 py-4 text-slate-300">{booking.facilityName}</td><td className="px-4 py-4 font-semibold text-white">{formatMoney(booking.totalPriceEtb)}</td><td className="px-4 py-4"><StatusPill status={booking.status} /></td><td className="px-5 py-4"><StatusPill status={booking.paymentStatus} /></td></tr>)}</tbody></table></div>}
        </Panel>
      )}

      <div className="rounded-xl border border-sky-400/15 bg-sky-400/[0.05] px-4 py-3 text-xs leading-5 text-sky-100/75">
        Refund controls record reconciliation after staff act in the Chapa dashboard. No dashboard button issues money, verifies a transaction, or confirms a booking.
      </div>
    </div>
  );
}
