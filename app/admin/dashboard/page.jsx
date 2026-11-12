"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  getAdminActivityLog,
  getAllBookings,
  getAllFacilityRequests,
  getAllPaymentReviews,
  getDashboardStats,
} from "@/src/lib/admin";
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
  shortId,
} from "@/src/components/admin/AdminUi";

const quickLinks = [
  { href: "/admin/facilities", title: "Add or update a facility", detail: "Publish verified venue information" },
  { href: "/admin/bookings?status=pending_payment", title: "Review pending bookings", detail: "Inspect active 30-minute reservations" },
  { href: "/admin/notifications", title: "Publish an announcement", detail: "Create a customer-facing notice" },
  { href: "/admin/reports", title: "Export a report", detail: "Download real booking and revenue data" },
];

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      const [stats, bookings, requests, paymentReviews, activity] = await Promise.all([
        getDashboardStats(),
        getAllBookings({ pageSize: 6 }),
        getAllFacilityRequests({ pageSize: 25 }),
        getAllPaymentReviews({ pageSize: 25 }),
        getAdminActivityLog({ pageSize: 6 }),
      ]);
      setData({
        stats,
        bookings,
        requests: requests.filter((item) => item.status === "pending").slice(0, 5),
        paymentReviews: paymentReviews
          .filter((item) => item.refundStatus === "manual_review")
          .slice(0, 5),
        activity,
      });
    } catch (nextError) {
      setError(nextError?.message ?? "The overview could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading && !data) return <LoadingState label="Loading the platform overview…" />;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Platform overview"
        title="Good operations start here."
        description="A current view of Firestore bookings, verified payment revenue, facilities, customers, and action queues. Empty values remain zero—no sample records or estimated statistics are used."
        actions={
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="min-h-10 rounded-xl border border-white/10 px-4 text-xs font-bold text-slate-200 transition hover:border-emerald-400/30 hover:bg-white/[0.04] disabled:opacity-50"
          >
            {loading ? "Refreshing…" : "Refresh live data"}
          </button>
        }
      />

      <ErrorBanner message={error} onRetry={load} />

      {data && (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total bookings" value={data.stats.totalBookings} detail={`${data.stats.todayBookings} dated today`} color="blue" symbol="B" />
            <MetricCard label="Confirmed bookings" value={data.stats.confirmedBookings} detail="Provider-verified payments" color="emerald" symbol="✓" />
            <MetricCard label="Pending payment" value={data.stats.pendingBookings} detail={`${formatMoney(data.stats.pendingPaymentValue)} awaiting payment`} color="amber" symbol="30" />
            <MetricCard label="Collected revenue" value={formatMoney(data.stats.totalRevenue)} detail="Paid, non-refunded bookings" color="emerald" symbol="ETB" />
            <MetricCard label="Published facilities" value={data.stats.activeFacilities} detail="Catalog and admin-managed venues" color="violet" symbol="F" />
            <MetricCard label="Customers" value={data.stats.totalCustomers} detail="Derived from actual platform activity" color="blue" symbol="C" />
            <MetricCard label="Payment reviews" value={data.stats.pendingReviews} detail="Manual reconciliation required" color="rose" symbol="!" />
            <MetricCard label="Open requests" value={data.stats.pendingFacilityRequests + data.stats.pendingCustomerReviews + data.stats.newFeedback} detail="Facility requests, reviews, and feedback" color="amber" symbol="Q" />
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
            <Panel
              title="Recent bookings"
              description="Newest booking records across every customer"
              action={<Link href="/admin/bookings" className="text-xs font-bold text-emerald-300 hover:text-emerald-200">View all →</Link>}
            >
              {data.bookings.length === 0 ? (
                <EmptyState title="No bookings yet" description="New customer bookings will appear here as soon as they are created." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.14em] text-slate-600">
                      <tr>
                        <th className="px-5 py-3 font-bold">Booking</th>
                        <th className="px-4 py-3 font-bold">Customer</th>
                        <th className="px-4 py-3 font-bold">Schedule</th>
                        <th className="px-4 py-3 font-bold">Amount</th>
                        <th className="px-5 py-3 font-bold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.06]">
                      {data.bookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-white/[0.02]">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-white">{booking.facilityName}</p>
                            <p className="mt-1 font-mono text-[10px] text-slate-600" title={booking.id}>{shortId(booking.id)}</p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-slate-300">{booking.customerName}</p>
                            <p className="mt-1 text-[11px] text-slate-600">{booking.customerPhone}</p>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-400">{booking.date}<br />{booking.timeSlot}–{booking.endTime} EAT</td>
                          <td className="px-4 py-4 font-semibold text-slate-200">{formatMoney(booking.totalPriceEtb)}</td>
                          <td className="px-5 py-4"><StatusPill status={booking.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Panel>

            <Panel title="Action center" description="Items that currently need staff attention">
              <div className="divide-y divide-white/[0.06] p-2">
                {[
                  { label: "Facility requests", count: data.stats.pendingFacilityRequests, href: "/admin/facility-requests", color: "text-amber-300" },
                  { label: "Payment reviews", count: data.stats.pendingReviews, href: "/admin/payments", color: "text-rose-300" },
                  { label: "Customer reviews", count: data.stats.pendingCustomerReviews, href: "/admin/reviews", color: "text-violet-300" },
                  { label: "New feedback", count: data.stats.newFeedback, href: "/admin/reviews", color: "text-sky-300" },
                ].map((item) => (
                  <Link key={item.label} href={item.href} className="flex items-center justify-between rounded-xl px-3 py-3.5 transition hover:bg-white/[0.04]">
                    <span className="text-sm font-semibold text-slate-300">{item.label}</span>
                    <span className={`text-lg font-black ${item.color}`}>{item.count}</span>
                  </Link>
                ))}
              </div>
            </Panel>
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            <Panel title="Pending facility requests" className="lg:col-span-1">
              {data.requests.length === 0 ? (
                <EmptyState title="Queue is clear" />
              ) : (
                <div className="divide-y divide-white/[0.06] px-5">
                  {data.requests.map((request) => (
                    <div key={request.id} className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{request.facilityName}</p>
                        <StatusPill status="pending" />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">{request.customerName} · {request.date}</p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Payment reconciliation" className="lg:col-span-1">
              {data.paymentReviews.length === 0 ? (
                <EmptyState title="No manual reviews" />
              ) : (
                <div className="divide-y divide-white/[0.06] px-5">
                  {data.paymentReviews.map((review) => (
                    <div key={review.id} className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-mono text-xs font-semibold text-white">{shortId(review.id)}</p>
                        <StatusPill status={review.refundStatus} />
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{review.reason}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-300">{formatMoney(review.amountEtb)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Latest administrator activity" className="lg:col-span-1">
              {data.activity.length === 0 ? (
                <EmptyState title="No admin actions recorded" />
              ) : (
                <div className="divide-y divide-white/[0.06] px-5">
                  {data.activity.map((entry) => (
                    <div key={entry.id} className="py-4">
                      <p className="text-xs font-bold capitalize text-slate-200">{String(entry.action).replaceAll("_", " ")}</p>
                      <p className="mt-1 truncate text-[11px] text-slate-500">{entry.adminEmail || entry.adminUid} · {entry.targetType}</p>
                      <p className="mt-1 text-[10px] text-slate-600">{formatAdminTime(entry.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </section>

          <Panel title="Quick actions" description="Common platform operations">
            <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">
              {quickLinks.map((item) => (
                <Link key={item.href} href={item.href} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/25 hover:bg-emerald-400/[0.04]">
                  <p className="text-sm font-bold text-white">{item.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                </Link>
              ))}
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}
