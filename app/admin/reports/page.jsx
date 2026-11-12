"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllBookings, getAllPaymentAttempts } from "@/src/lib/admin";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  MetricCard,
  PageHeader,
  Panel,
  StatusPill,
  formatAdminTime,
  formatMoney,
  inputClass,
} from "@/src/components/admin/AdminUi";

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function downloadCsv(filename, headers, rows) {
  const body = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${body}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function AdminReportsPage() {
  const [bookings, setBookings] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      const [bookingData, attemptData] = await Promise.all([
        getAllBookings({ pageSize: 1_000 }),
        getAllPaymentAttempts({ pageSize: 1_000 }),
      ]);
      setBookings(bookingData);
      setAttempts(attemptData);
    } catch (nextError) {
      setError(nextError?.message ?? "Reports could not be generated.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(
    () => bookings.filter((booking) => (!startDate || booking.date >= startDate) && (!endDate || booking.date <= endDate)),
    [bookings, startDate, endDate],
  );

  const report = useMemo(() => {
    const facilities = new Map();
    const months = new Map();
    const statuses = new Map();
    let revenue = 0;
    let confirmed = 0;
    for (const booking of filtered) {
      const paid = booking.paymentStatus === "paid";
      if (paid) revenue += Number(booking.totalPriceEtb) || 0;
      if (booking.status === "confirmed") confirmed += 1;
      statuses.set(booking.status, (statuses.get(booking.status) ?? 0) + 1);
      const facility = facilities.get(booking.fieldId) ?? {
        id: booking.fieldId,
        name: booking.facilityName,
        bookings: 0,
        confirmed: 0,
        revenue: 0,
      };
      facility.bookings += 1;
      if (booking.status === "confirmed") facility.confirmed += 1;
      if (paid) facility.revenue += Number(booking.totalPriceEtb) || 0;
      facilities.set(booking.fieldId, facility);
      const month = String(booking.date ?? "").slice(0, 7) || "Unknown";
      const monthData = months.get(month) ?? { month, bookings: 0, revenue: 0 };
      monthData.bookings += 1;
      if (paid) monthData.revenue += Number(booking.totalPriceEtb) || 0;
      months.set(month, monthData);
    }
    return {
      revenue,
      confirmed,
      facilities: [...facilities.values()].sort((a, b) => b.bookings - a.bookings),
      months: [...months.values()].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12),
      statuses: [...statuses.entries()].map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
    };
  }, [filtered]);

  function exportBookings() {
    downloadCsv(
      `dire-sport-fields-bookings-${startDate || "all"}-${endDate || "all"}.csv`,
      ["Booking ID", "Facility", "Customer", "Email", "Phone", "Booking date", "Start", "End", "Duration hours", "Amount ETB", "Booking status", "Payment status", "Created EAT"],
      filtered.map((item) => [item.id, item.facilityName, item.customerName, item.customerEmail, item.customerPhone, item.date, item.timeSlot, item.endTime, item.durationHours, item.totalPriceEtb, item.status, item.paymentStatus, formatAdminTime(item.createdAt)]),
    );
  }

  function exportFacilitySummary() {
    downloadCsv(
      "dire-sport-fields-facility-summary.csv",
      ["Facility ID", "Facility", "Bookings", "Confirmed", "Paid revenue ETB"],
      report.facilities.map((item) => [item.id, item.name, item.bookings, item.confirmed, item.revenue]),
    );
  }

  if (loading && bookings.length === 0) return <LoadingState label="Computing reports from live records…" />;

  const conversion = filtered.length ? Math.round((report.confirmed / filtered.length) * 100) : 0;
  const paidAttempts = attempts.filter((item) => item.status === "paid").length;
  const completedAttempts = attempts.filter((item) => ["paid", "paid_late", "review_required", "failed", "refunded"].includes(item.status)).length;
  const paymentRate = completedAttempts ? Math.round((paidAttempts / completedAttempts) * 100) : 0;
  const maxFacilityBookings = Math.max(1, ...report.facilities.map((item) => item.bookings));

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Reports and analytics" title="Operational reporting" description="Every number below is calculated from current Firestore booking and payment records. Choose a booking-date range, inspect performance, and export the exact rows behind the totals." actions={<><button type="button" onClick={exportFacilitySummary} disabled={report.facilities.length === 0} className="min-h-10 rounded-xl border border-white/10 px-4 text-xs font-bold text-slate-300 hover:bg-white/5 disabled:opacity-40">Export facility summary</button><button type="button" onClick={exportBookings} disabled={filtered.length === 0} className="min-h-10 rounded-xl bg-emerald-400 px-4 text-xs font-extrabold text-[#07110d] hover:bg-emerald-300 disabled:opacity-40">Export booking CSV</button></>} />
      <ErrorBanner message={error} onRetry={load} />

      <Panel title="Report period" description="Filters use the scheduled booking date in East Africa Time.">
        <div className="grid gap-3 p-4 sm:grid-cols-[1fr_1fr_auto]">
          <label className="text-xs font-bold text-slate-400">From<input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} className={`mt-2 ${inputClass} [color-scheme:dark]`} /></label>
          <label className="text-xs font-bold text-slate-400">To<input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} className={`mt-2 ${inputClass} [color-scheme:dark]`} /></label>
          <button type="button" onClick={() => { setStartDate(""); setEndDate(""); }} disabled={!startDate && !endDate} className="mt-5 min-h-11 rounded-xl border border-white/10 px-4 text-xs font-bold text-slate-300 hover:bg-white/5 disabled:opacity-40">All dates</button>
        </div>
      </Panel>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Bookings" value={filtered.length} detail="Within selected booking dates" color="blue" symbol="B" />
        <MetricCard label="Confirmed" value={report.confirmed} detail={`${conversion}% booking conversion`} color="emerald" symbol="✓" />
        <MetricCard label="Paid revenue" value={formatMoney(report.revenue)} detail="Excludes refunded and unpaid" color="emerald" symbol="ETB" />
        <MetricCard label="Average paid booking" value={formatMoney(report.confirmed ? report.revenue / report.confirmed : 0)} detail="Revenue divided by confirmed count" color="violet" symbol="Ø" />
        <MetricCard label="Payment success" value={`${paymentRate}%`} detail={`${paidAttempts} of ${completedAttempts} completed attempts`} color="amber" symbol="P" />
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Panel title="Monthly booking volume" description="Grouped by scheduled booking month.">
          {report.months.length === 0 ? <EmptyState title="No monthly data in this period" /> : <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.14em] text-slate-600"><tr><th className="px-5 py-3">Month</th><th className="px-4 py-3 text-right">Bookings</th><th className="px-5 py-3 text-right">Paid revenue</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{report.months.map((item) => <tr key={item.month}><td className="px-5 py-4 font-semibold text-white">{item.month}</td><td className="px-4 py-4 text-right text-slate-300">{item.bookings}</td><td className="px-5 py-4 text-right font-semibold text-slate-200">{formatMoney(item.revenue)}</td></tr>)}</tbody></table></div>}
        </Panel>

        <Panel title="Booking status distribution" description="Current final and in-progress booking states.">
          {report.statuses.length === 0 ? <EmptyState title="No status data in this period" /> : <div className="space-y-4 p-5">{report.statuses.map((item) => { const percentage = filtered.length ? Math.round((item.count / filtered.length) * 100) : 0; return <div key={item.status}><div className="flex items-center justify-between gap-3"><StatusPill status={item.status} /><span className="text-xs font-bold text-slate-300">{item.count} · {percentage}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${percentage}%` }} /></div></div>; })}</div>}
        </Panel>
      </section>

      <Panel title="Facility performance" description="Ranked by actual booking count for the selected period.">
        {report.facilities.length === 0 ? <EmptyState title="No facility performance data" /> : <div className="grid gap-4 p-5 lg:grid-cols-2">{report.facilities.map((item) => <article key={item.id} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-white">{item.name}</p><p className="mt-1 text-[10px] text-slate-600">{item.id}</p></div><span className="text-lg font-black text-emerald-300">{item.bookings}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${(item.bookings / maxFacilityBookings) * 100}%` }} /></div><div className="mt-3 flex justify-between text-xs text-slate-500"><span>{item.confirmed} confirmed</span><span className="font-semibold text-slate-300">{formatMoney(item.revenue)}</span></div></article>)}</div>}
      </Panel>

      <p className="rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-xs leading-5 text-slate-500">The browser computes these reports from up to the latest 1,000 stored booking records. CSV exports contain the filtered records shown here and never include generated rows.</p>
    </div>
  );
}
