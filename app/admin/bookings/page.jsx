"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { cancelBookingAsAdmin, getAllBookings } from "@/src/lib/admin";
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

function toMillis(value) {
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (value instanceof Date) return value.getTime();
  return Number(value) || 0;
}

function PaymentCountdown({ expiresAt, now }) {
  const seconds = Math.max(0, Math.ceil((toMillis(expiresAt) - now) / 1000));
  if (!toMillis(expiresAt)) return <span className="text-slate-600">—</span>;
  return (
    <span className={`font-mono text-xs font-bold tabular-nums ${seconds > 0 ? "text-amber-300" : "text-rose-300"}`}>
      {seconds > 0
        ? `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`
        : "Expired"}
    </span>
  );
}

function BookingDetails({ booking, now, cancelling, onCancel, onClose }) {
  const [reason, setReason] = useState("Cancelled by administrator");
  const canCancel =
    ["pending_payment", "pending"].includes(booking.status) && booking.paymentStatus !== "paid";
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#0a1712] p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">Booking record</p>
            <h2 className="mt-2 text-xl font-black text-white">{booking.facilityName}</h2>
            <p className="mt-1 break-all font-mono text-[11px] text-slate-600">{booking.id}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5">Close</button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2"><StatusPill status={booking.status} /><StatusPill status={booking.paymentStatus} /></div>
        <dl className="mt-6 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] px-4">
          {[
            ["Customer", booking.customerName],
            ["Email", booking.customerEmail || "—"],
            ["Phone", booking.customerPhone || "—"],
            ["Booking date", booking.date],
            ["Time", `${booking.timeSlot}–${booking.endTime} EAT`],
            ["Duration", `${booking.durationHours} hour${booking.durationHours === 1 ? "" : "s"}`],
            ["Players", booking.participantCount ?? "—"],
            ["Hourly price", formatMoney(booking.hourlyPriceEtb)],
            ["Total", formatMoney(booking.totalPriceEtb)],
            ["Created", formatAdminTime(booking.createdAt)],
            ["Payment deadline", formatAdminTime(booking.paymentExpiresAt)],
          ].map(([label, value]) => (
            <div key={label} className="grid grid-cols-[9rem_1fr] gap-3 py-3 text-sm">
              <dt className="text-xs font-semibold text-slate-600">{label}</dt>
              <dd className="break-words text-right text-slate-300">{value}</dd>
            </div>
          ))}
          {booking.status === "pending_payment" && (
            <div className="grid grid-cols-[9rem_1fr] gap-3 py-3"><dt className="text-xs font-semibold text-slate-600">Time remaining</dt><dd className="text-right"><PaymentCountdown expiresAt={booking.paymentExpiresAt} now={now} /></dd></div>
          )}
        </dl>

        {booking.reservedSlots?.length > 0 && (
          <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
            <p className="text-xs font-bold text-slate-300">Reserved slot locks</p>
            <div className="mt-3 flex flex-wrap gap-2">{booking.reservedSlots.map((slot) => <span key={slot} className="rounded-lg border border-white/10 px-2.5 py-1 font-mono text-xs text-slate-400">{slot}</span>)}</div>
          </div>
        )}

        {canCancel && (
          <div className="mt-6 rounded-2xl border border-rose-400/15 bg-rose-400/[0.05] p-4">
            <h3 className="text-sm font-bold text-rose-200">Cancel this unpaid reservation</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">Cancellation releases only the slot locks owned by this booking. Paid or confirmed bookings cannot be changed here.</p>
            <label className="mt-4 block text-xs font-semibold text-slate-300">Reason<input value={reason} onChange={(event) => setReason(event.target.value)} className={`mt-2 ${inputClass}`} /></label>
            <button type="button" disabled={cancelling || reason.trim().length < 3} onClick={() => onCancel(booking.id, reason)} className="mt-3 min-h-10 w-full rounded-xl border border-rose-400/25 bg-rose-400/10 text-xs font-bold text-rose-200 hover:bg-rose-400/15 disabled:opacity-50">{cancelling ? "Cancelling securely…" : "Cancel booking and release slots"}</button>
          </div>
        )}
      </aside>
    </div>
  );
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [queryText, setQueryText] = useState("");
  const [status, setStatus] = useState("all");
  const [payment, setPayment] = useState("all");
  const [date, setDate] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cancelling, setCancelling] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      setBookings(await getAllBookings({ pageSize: 1_000 }));
    } catch (nextError) {
      setError(nextError?.message ?? "Bookings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const filtered = useMemo(() => {
    const search = queryText.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (search && ![booking.id, booking.facilityName, booking.customerName, booking.customerEmail, booking.customerPhone].join(" ").toLowerCase().includes(search)) return false;
      if (status !== "all" && booking.status !== status) return false;
      if (payment !== "all" && booking.paymentStatus !== payment) return false;
      if (date && booking.date !== date) return false;
      return true;
    });
  }, [bookings, queryText, status, payment, date]);

  async function handleCancel(bookingId, reason) {
    setCancelling(bookingId);
    setError("");
    try {
      await cancelBookingAsAdmin({ bookingId, reason });
      setBookings((current) => current.map((item) => item.id === bookingId ? { ...item, status: "cancelled", cancellationReason: reason } : item));
      setSelected((current) => current?.id === bookingId ? { ...current, status: "cancelled", cancellationReason: reason } : current);
      setSuccess("The booking was cancelled and its owned reservation slots were released.");
    } catch (nextError) {
      setError(nextError?.message ?? "The booking could not be cancelled.");
    } finally {
      setCancelling("");
    }
  }

  if (loading && bookings.length === 0) return <LoadingState label="Loading booking records…" />;

  const confirmed = bookings.filter((item) => item.status === "confirmed").length;
  const pending = bookings.filter((item) => item.status === "pending_payment").length;
  const expired = bookings.filter((item) => item.status === "expired").length;
  const revenue = bookings.filter((item) => item.paymentStatus === "paid").reduce((sum, item) => sum + (Number(item.totalPriceEtb) || 0), 0);

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Booking management" title="Reservations and slot locks" description="Inspect every real booking, its exact 30-minute payment deadline, customer details, and reserved hours. Payment confirmation remains controlled exclusively by verified Chapa callbacks." actions={<button type="button" onClick={load} disabled={loading} className="min-h-10 rounded-xl border border-white/10 px-4 text-xs font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button>} />
      <ErrorBanner message={error} onRetry={load} />
      <SuccessBanner message={success} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="All bookings" value={bookings.length} detail="Loaded from bookingGroups" color="blue" symbol="B" />
        <MetricCard label="Confirmed" value={confirmed} detail="Payment verified by provider" color="emerald" symbol="✓" />
        <MetricCard label="Pending payment" value={pending} detail="Active or awaiting expiry" color="amber" symbol="30" />
        <MetricCard label="Collected revenue" value={formatMoney(revenue)} detail={`${expired} expired reservations`} color="violet" symbol="ETB" />
      </section>

      <Panel>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
          <input type="search" value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="Search reference, customer, facility…" className={`xl:col-span-2 ${inputClass}`} />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}><option value="all">All booking statuses</option><option value="pending_payment">Pending payment</option><option value="confirmed">Confirmed</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option></select>
          <select value={payment} onChange={(event) => setPayment(event.target.value)} className={inputClass}><option value="all">All payment statuses</option><option value="unpaid">Unpaid</option><option value="processing">Processing</option><option value="paid">Paid</option><option value="failed">Failed</option><option value="expired">Expired</option><option value="refunded">Refunded</option></select>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={`${inputClass} [color-scheme:dark]`} aria-label="Filter booking date" />
        </div>
      </Panel>

      <Panel title={`${filtered.length} booking${filtered.length === 1 ? "" : "s"}`} description="Select a row to inspect the full record.">
        {filtered.length === 0 ? (
          <EmptyState title="No bookings match these filters" description="The dashboard does not create placeholder booking records." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.14em] text-slate-600"><tr><th className="px-5 py-3">Booking / facility</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Schedule</th><th className="px-4 py-3">Amount</th><th className="px-4 py-3">Booking</th><th className="px-4 py-3">Payment</th><th className="px-4 py-3">Deadline</th><th className="px-5 py-3">Action</th></tr></thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-4"><p className="max-w-52 truncate font-semibold text-white">{booking.facilityName}</p><p className="mt-1 font-mono text-[10px] text-slate-600" title={booking.id}>{shortId(booking.id)}</p></td>
                    <td className="px-4 py-4"><p className="text-slate-300">{booking.customerName}</p><p className="mt-1 text-[11px] text-slate-600">{booking.customerPhone}</p></td>
                    <td className="px-4 py-4 text-xs text-slate-400">{booking.date}<br />{booking.timeSlot}–{booking.endTime}</td>
                    <td className="px-4 py-4 font-semibold text-slate-200">{formatMoney(booking.totalPriceEtb)}</td>
                    <td className="px-4 py-4"><StatusPill status={booking.status} /></td>
                    <td className="px-4 py-4"><StatusPill status={booking.paymentStatus} /></td>
                    <td className="px-4 py-4">{booking.status === "pending_payment" ? <PaymentCountdown expiresAt={booking.paymentExpiresAt} now={now} /> : <span className="text-xs text-slate-600">—</span>}</td>
                    <td className="px-5 py-4"><button type="button" onClick={() => setSelected(booking)} className="min-h-9 rounded-lg border border-white/10 px-3 text-[11px] font-bold text-slate-300 hover:border-emerald-400/30 hover:bg-white/5 hover:text-white">Details</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selected && <BookingDetails booking={selected} now={now} cancelling={cancelling === selected.id} onCancel={handleCancel} onClose={() => setSelected(null)} />}
    </div>
  );
}
