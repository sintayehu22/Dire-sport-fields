"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAdminActivityLog } from "@/src/lib/admin";
import {
  EmptyState,
  ErrorBanner,
  LoadingState,
  MetricCard,
  PageHeader,
  Panel,
  formatAdminTime,
  inputClass,
  shortId,
} from "@/src/components/admin/AdminUi";

export default function AdminActivityLogPage() {
  const [entries, setEntries] = useState([]);
  const [queryText, setQueryText] = useState("");
  const [targetType, setTargetType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      setEntries(await getAdminActivityLog({ pageSize: 1_000 }));
    } catch (nextError) {
      setError(nextError?.message ?? "Administrator activity could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const types = useMemo(() => [...new Set(entries.map((item) => item.targetType).filter(Boolean))].sort(), [entries]);
  const filtered = useMemo(() => {
    const search = queryText.trim().toLowerCase();
    return entries.filter((entry) => {
      if (targetType !== "all" && entry.targetType !== targetType) return false;
      return !search || [entry.action, entry.targetType, entry.targetId, entry.details, entry.adminEmail, entry.adminUid].join(" ").toLowerCase().includes(search);
    });
  }, [entries, queryText, targetType]);

  if (loading && entries.length === 0) return <LoadingState label="Loading administrator activity…" />;

  const admins = new Set(entries.map((item) => item.adminUid).filter(Boolean)).size;
  const cancellations = entries.filter((item) => item.action === "cancel_booking").length;
  const facilityChanges = entries.filter((item) => ["create_facility", "update_facility", "archive_facility"].includes(item.action)).length;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Audit and accountability" title="Administrator activity log" description="Server-generated records of privileged changes. Dashboard clients cannot directly write arbitrary audit entries, which keeps the history tied to validated Cloud Function actions." actions={<button type="button" onClick={load} disabled={loading} className="min-h-10 rounded-xl border border-white/10 px-4 text-xs font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button>} />
      <ErrorBanner message={error} onRetry={load} />

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Logged actions" value={entries.length} detail="Latest stored admin operations" color="blue" symbol="A" />
        <MetricCard label="Administrators" value={admins} detail="Unique acting admin UIDs" color="violet" symbol="U" />
        <MetricCard label="Key changes" value={facilityChanges + cancellations} detail={`${facilityChanges} facility · ${cancellations} cancellation`} color="amber" symbol="!" />
      </section>

      <Panel>
        <div className="grid gap-3 p-4 sm:grid-cols-[1fr_14rem]">
          <input type="search" value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder="Search action, admin, target, or details…" className={inputClass} />
          <select value={targetType} onChange={(event) => setTargetType(event.target.value)} className={inputClass}><option value="all">All target types</option>{types.map((item) => <option key={item} value={item}>{item.replaceAll("_", " ")}</option>)}</select>
        </div>
      </Panel>

      <Panel title={`${filtered.length} activity entr${filtered.length === 1 ? "y" : "ies"}`} description="Newest server timestamps first.">
        {filtered.length === 0 ? (
          <EmptyState title="No activity matches" description="Audit entries appear only after validated administrator changes." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className="border-b border-white/[0.07] text-[10px] uppercase tracking-[0.14em] text-slate-600"><tr><th className="px-5 py-3">Timestamp</th><th className="px-4 py-3">Administrator</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Target</th><th className="px-5 py-3">Details</th></tr></thead>
              <tbody className="divide-y divide-white/[0.06]">
                {filtered.map((entry) => (
                  <tr key={entry.id} className="align-top hover:bg-white/[0.02]">
                    <td className="px-5 py-4 text-xs text-slate-500">{formatAdminTime(entry.createdAt)}</td>
                    <td className="px-4 py-4"><p className="text-xs text-slate-300">{entry.adminEmail || "Admin account"}</p><p className="mt-1 font-mono text-[10px] text-slate-600" title={entry.adminUid}>{shortId(entry.adminUid)}</p></td>
                    <td className="px-4 py-4"><span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-2.5 py-1 text-[10px] font-bold capitalize text-emerald-200">{String(entry.action).replaceAll("_", " ")}</span></td>
                    <td className="px-4 py-4"><p className="text-xs capitalize text-slate-300">{String(entry.targetType).replaceAll("_", " ")}</p><p className="mt-1 font-mono text-[10px] text-slate-600" title={entry.targetId}>{shortId(entry.targetId)}</p></td>
                    <td className="max-w-sm px-5 py-4 text-xs leading-5 text-slate-400">{entry.details || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
