"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllFacilityRequests, updateFacilityRequestStatus } from "@/src/lib/admin";
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
  inputClass,
  shortId,
} from "@/src/components/admin/AdminUi";

export default function AdminFacilityRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("all");
  const [queryText, setQueryText] = useState("");
  const [selected, setSelected] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      setRequests(await getAllFacilityRequests({ pageSize: 1_000 }));
    } catch (nextError) {
      setError(nextError?.message ?? "Facility requests could not be loaded.");
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
    return requests.filter((request) => {
      if (status !== "all" && request.status !== status) return false;
      if (search && ![request.id, request.facilityName, request.customerName, request.customerPhone, request.neighborhood].join(" ").toLowerCase().includes(search)) return false;
      return true;
    });
  }, [requests, status, queryText]);

  function openRequest(request) {
    setSelected(request);
    setAdminNote(request.adminNote ?? "");
    setSuccess("");
  }

  async function handleDecision(nextStatus) {
    if (!selected) return;
    setProcessing(true);
    setError("");
    try {
      await updateFacilityRequestStatus({ requestId: selected.id, status: nextStatus, adminNote });
      const updated = { ...selected, status: nextStatus, adminNote, reviewedAt: new Date() };
      setRequests((current) => current.map((item) => item.id === selected.id ? updated : item));
      setSelected(updated);
      setSuccess(`Request ${nextStatus}. The decision was added to the administrator activity log.`);
    } catch (nextError) {
      setError(nextError?.message ?? "The request could not be updated.");
    } finally {
      setProcessing(false);
    }
  }

  if (loading && requests.length === 0) return <LoadingState label="Loading facility requests…" />;

  const pending = requests.filter((item) => item.status === "pending").length;
  const approved = requests.filter((item) => item.status === "approved").length;
  const rejected = requests.filter((item) => item.status === "rejected").length;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Facility requests" title="Venue enquiry queue" description="Review booking enquiries for facilities that do not use instant online payment. Decisions update the original request; they do not create a booking or charge the customer." actions={<button type="button" onClick={load} disabled={loading} className="min-h-10 rounded-xl border border-white/10 px-4 text-xs font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button>} />
      <ErrorBanner message={error} onRetry={load} />
      <SuccessBanner message={success} />

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Pending" value={pending} detail="Awaiting an administrator decision" color="amber" symbol="Q" />
        <MetricCard label="Approved" value={approved} detail="Accepted venue enquiries" color="emerald" symbol="✓" />
        <MetricCard label="Rejected" value={rejected} detail="Closed venue enquiries" color="rose" symbol="×" />
      </section>

      <Panel>
        <div className="grid gap-3 p-4 sm:grid-cols-[1fr_15rem]">
          <input type="search" value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="Search facility, customer, phone, or reference…" className={inputClass} />
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
        </div>
      </Panel>

      <Panel title={`${filtered.length} request${filtered.length === 1 ? "" : "s"}`} description="Select a request to review all customer-provided details.">
        {filtered.length === 0 ? (
          <EmptyState title="No facility requests match" description="No placeholder enquiries are generated." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.14em] text-slate-600"><tr><th className="px-5 py-3">Facility</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Requested visit</th><th className="px-4 py-3">Group</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Status</th><th className="px-5 py-3">Action</th></tr></thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filtered.map((request) => (
                  <tr key={request.id} className="hover:bg-white/[0.02]">
                    <td className="px-5 py-4"><p className="font-semibold text-white">{request.facilityName}</p><p className="mt-1 text-[11px] text-slate-600">{request.neighborhood} · {shortId(request.id)}</p></td>
                    <td className="px-4 py-4"><p className="text-slate-300">{request.customerName}</p><p className="mt-1 text-[11px] text-slate-600">{request.customerPhone}</p></td>
                    <td className="px-4 py-4 text-xs text-slate-400">{request.date}<br />{request.preferredTime || "Any time"}</td>
                    <td className="px-4 py-4 text-xs text-slate-400">{request.partySize ? `${request.partySize} people` : "—"}<br />{request.durationHours ? `${request.durationHours} hr` : ""}</td>
                    <td className="px-4 py-4 text-xs text-slate-500">{formatAdminTime(request.createdAt)}</td>
                    <td className="px-4 py-4"><StatusPill status={request.status} /></td>
                    <td className="px-5 py-4"><button type="button" onClick={() => openRequest(request)} className="min-h-9 rounded-lg border border-white/10 px-3 text-[11px] font-bold text-slate-300 hover:border-emerald-400/30 hover:bg-white/5">Review</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && setSelected(null)}>
          <aside className="h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-[#0a1712] p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">Facility request</p><h2 className="mt-2 text-xl font-black text-white">{selected.facilityName}</h2><p className="mt-1 break-all font-mono text-[10px] text-slate-600">{selected.id}</p></div><button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5">Close</button></div>
            <div className="mt-5"><StatusPill status={selected.status} /></div>
            <dl className="mt-5 divide-y divide-white/[0.06] rounded-2xl border border-white/[0.08] px-4">
              {[["Customer", selected.customerName], ["Phone", selected.customerPhone], ["Neighborhood", selected.neighborhood], ["Category", selected.category], ["Date", selected.date], ["Preferred time", selected.preferredTime || "Any time"], ["Duration", selected.durationHours ? `${selected.durationHours} hour(s)` : "—"], ["Party size", selected.partySize ?? "—"], ["Created", formatAdminTime(selected.createdAt)]].map(([label, value]) => <div key={label} className="grid grid-cols-[8rem_1fr] gap-3 py-3 text-sm"><dt className="text-xs font-semibold text-slate-600">{label}</dt><dd className="text-right capitalize text-slate-300">{value}</dd></div>)}
            </dl>
            {selected.message && <div className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"><p className="text-xs font-bold text-slate-400">Customer message</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">{selected.message}</p></div>}
            {selected.status === "pending" ? (
              <div className="mt-6 rounded-2xl border border-white/[0.08] p-4"><label className="block text-xs font-bold text-slate-300">Decision note<textarea rows={4} value={adminNote} onChange={(event) => setAdminNote(event.target.value)} placeholder="Optional internal/context note" className={`mt-2 py-3 ${inputClass}`} /></label><div className="mt-3 grid grid-cols-2 gap-3"><button type="button" disabled={processing} onClick={() => handleDecision("rejected")} className="min-h-11 rounded-xl border border-rose-400/25 text-xs font-bold text-rose-200 hover:bg-rose-400/10 disabled:opacity-50">Reject request</button><button type="button" disabled={processing} onClick={() => handleDecision("approved")} className="min-h-11 rounded-xl bg-emerald-400 text-xs font-extrabold text-[#07110d] hover:bg-emerald-300 disabled:opacity-50">{processing ? "Saving…" : "Approve request"}</button></div></div>
            ) : (
              <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"><p className="text-xs font-bold text-slate-400">Administrator note</p><p className="mt-2 text-sm text-slate-300">{selected.adminNote || "No note was recorded."}</p><p className="mt-2 text-[10px] text-slate-600">Reviewed {formatAdminTime(selected.reviewedAt)}</p></div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
