"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getCustomerBookings, getCustomers, updateCustomerAdmin } from "@/src/lib/admin";
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

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [queryText, setQueryText] = useState("");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      setCustomers(await getCustomers());
    } catch (nextError) {
      setError(nextError?.message ?? "Customers could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => {
    const search = queryText.trim().toLowerCase();
    return customers.filter((customer) => {
      if (status !== "all" && customer.status !== status) return false;
      return !search || [customer.uid, customer.name, customer.email, customer.phone].join(" ").toLowerCase().includes(search);
    });
  }, [customers, queryText, status]);

  async function openCustomer(customer) {
    setSelected(customer);
    setAdminNote(customer.adminNote ?? "");
    setBookings([]);
    setDetailsLoading(true);
    setSuccess("");
    try {
      setBookings(await getCustomerBookings(customer.uid));
    } catch (nextError) {
      setError(nextError?.message ?? "Customer booking history could not be loaded.");
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleStatus(nextStatus) {
    if (!selected) return;
    if (nextStatus === "blocked" && !window.confirm("Block this customer from creating new bookings, requests, reviews, and feedback? Existing records will be preserved.")) return;
    setUpdating(true);
    setError("");
    try {
      await updateCustomerAdmin({ customerUid: selected.uid, status: nextStatus, adminNote });
      const updated = { ...selected, status: nextStatus, adminNote };
      setSelected(updated);
      setCustomers((current) => current.map((item) => item.uid === selected.uid ? updated : item));
      setSuccess(`Customer status changed to ${nextStatus}.`);
    } catch (nextError) {
      setError(nextError?.message ?? "Customer status could not be updated.");
    } finally {
      setUpdating(false);
    }
  }

  if (loading && customers.length === 0) return <LoadingState label="Building customer records from platform activity…" />;

  const blocked = customers.filter((item) => item.status === "blocked").length;
  const bookingsCount = customers.reduce((sum, item) => sum + item.bookings, 0);
  const spent = customers.reduce((sum, item) => sum + item.totalSpent, 0);

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Customer management" title="Customers" description="Customer profiles are derived from real booking and facility-request ownership. Administrative status and notes are stored separately so original customer and transaction records remain unchanged." actions={<button type="button" onClick={load} disabled={loading} className="min-h-10 rounded-xl border border-white/10 px-4 text-xs font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button>} />
      <ErrorBanner message={error} onRetry={load} />
      <SuccessBanner message={success} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Customers" value={customers.length} detail="Unique Firebase owner UIDs" color="blue" symbol="C" />
        <MetricCard label="Bookings" value={bookingsCount} detail="Across all listed customers" color="violet" symbol="B" />
        <MetricCard label="Customer spend" value={formatMoney(spent)} detail="Current paid booking totals" color="emerald" symbol="ETB" />
        <MetricCard label="Blocked" value={blocked} detail="Restricted from new activity" color="rose" symbol="!" />
      </section>

      <Panel>
        <div className="grid gap-3 p-4 sm:grid-cols-[1fr_14rem]">
          <input type="search" value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="Search name, email, phone, or UID…" className={inputClass} />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}><option value="all">All customer statuses</option><option value="active">Active</option><option value="blocked">Blocked</option></select>
        </div>
      </Panel>

      <Panel title={`${filtered.length} customer${filtered.length === 1 ? "" : "s"}`} description="Select a customer to review booking history and administrative controls.">
        {filtered.length === 0 ? (
          <EmptyState title="No customers match" description="Customer rows appear only after real platform activity." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.14em] text-slate-600"><tr><th className="px-5 py-3">Customer</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Bookings</th><th className="px-4 py-3">Requests</th><th className="px-4 py-3">Paid total</th><th className="px-4 py-3">Last activity</th><th className="px-4 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filtered.map((customer) => (
                  <tr key={customer.uid} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-4"><p className="font-semibold text-white">{customer.name || "Unnamed customer"}</p><p className="mt-1 font-mono text-[10px] text-slate-600" title={customer.uid}>{shortId(customer.uid)}</p></td>
                    <td className="px-4 py-4"><p className="text-xs text-slate-300">{customer.email || "—"}</p><p className="mt-1 text-[11px] text-slate-600">{customer.phone || "—"}</p></td>
                    <td className="px-4 py-4 text-slate-300">{customer.bookings}<span className="ml-1 text-[10px] text-emerald-400">({customer.confirmedBookings} confirmed)</span></td>
                    <td className="px-4 py-4 text-slate-300">{customer.requests}</td>
                    <td className="px-4 py-4 font-semibold text-white">{formatMoney(customer.totalSpent)}</td>
                    <td className="px-4 py-4 text-xs text-slate-500">{formatAdminTime(customer.lastActivity)}</td>
                    <td className="px-4 py-4"><StatusPill status={customer.status} /></td>
                    <td className="px-5 py-4"><button type="button" onClick={() => openCustomer(customer)} className="min-h-9 rounded-lg border border-white/10 px-3 text-[11px] font-bold text-slate-300 hover:border-emerald-400/30 hover:bg-white/5">Open profile</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-white/10 bg-[#0a1712] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">Customer profile</p><h2 className="mt-2 text-xl font-black text-white">{selected.name || "Unnamed customer"}</h2><p className="mt-1 break-all font-mono text-[10px] text-slate-600">{selected.uid}</p></div><button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5">Close</button></div>
            <div className="mt-5 flex items-center gap-2"><StatusPill status={selected.status} /><span className="text-xs text-slate-500">{selected.bookings} bookings · {selected.requests} requests</span></div>
            <dl className="mt-5 grid gap-3 rounded-2xl border border-white/[0.08] p-4 sm:grid-cols-2"><div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Email</dt><dd className="mt-1 break-all text-sm text-slate-300">{selected.email || "—"}</dd></div><div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Phone</dt><dd className="mt-1 text-sm text-slate-300">{selected.phone || "—"}</dd></div><div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Confirmed bookings</dt><dd className="mt-1 text-sm text-slate-300">{selected.confirmedBookings}</dd></div><div><dt className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Paid total</dt><dd className="mt-1 text-sm font-bold text-white">{formatMoney(selected.totalSpent)}</dd></div></dl>

            <section className="mt-6"><h3 className="text-sm font-bold text-white">Booking history</h3>{detailsLoading ? <p className="mt-4 text-xs text-slate-500">Loading booking history…</p> : bookings.length === 0 ? <div className="mt-3 rounded-xl border border-white/[0.08]"><EmptyState title="No bookings for this UID" /></div> : <div className="mt-3 overflow-x-auto rounded-xl border border-white/[0.08]"><table className="w-full min-w-[620px] text-left text-xs"><thead className="border-b border-white/[0.07] uppercase tracking-wider text-slate-600"><tr><th className="px-3 py-3">Facility</th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Status</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{bookings.map((booking) => <tr key={booking.id}><td className="px-3 py-3 text-slate-300">{booking.facilityName}</td><td className="px-3 py-3 text-slate-500">{booking.date} · {booking.timeSlot}</td><td className="px-3 py-3 text-slate-300">{formatMoney(booking.totalPriceEtb)}</td><td className="px-3 py-3"><StatusPill status={booking.status} /></td></tr>)}</tbody></table></div>}</section>

            <section className="mt-6 rounded-2xl border border-white/[0.08] p-4"><h3 className="text-sm font-bold text-white">Administrative access control</h3><p className="mt-1 text-xs leading-5 text-slate-500">Blocking prevents new server-side bookings, venue requests, reviews, and feedback. It does not delete identity or transaction history.</p><label className="mt-4 block text-xs font-semibold text-slate-300">Internal note<textarea rows={3} value={adminNote} onChange={(event) => setAdminNote(event.target.value)} className={`mt-2 py-3 ${inputClass}`} /></label><div className="mt-3 grid grid-cols-2 gap-3"><button type="button" disabled={updating || selected.status === "blocked"} onClick={() => handleStatus("blocked")} className="min-h-10 rounded-xl border border-rose-400/25 text-xs font-bold text-rose-200 hover:bg-rose-400/10 disabled:opacity-40">Block new activity</button><button type="button" disabled={updating || selected.status === "active"} onClick={() => handleStatus("active")} className="min-h-10 rounded-xl bg-emerald-400 text-xs font-extrabold text-[#07110d] hover:bg-emerald-300 disabled:opacity-40">Restore active status</button></div></section>
          </aside>
        </div>
      )}
    </div>
  );
}
