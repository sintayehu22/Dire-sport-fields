"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  archiveAdminNotification,
  createAdminNotification,
  getAdminNotifications,
  updateAdminNotification,
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
  inputClass,
} from "@/src/components/admin/AdminUi";

const TYPE_COLORS = {
  info: "border-sky-400/20 bg-sky-400/[0.06] text-sky-200",
  success: "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200",
  warning: "border-amber-400/20 bg-amber-400/[0.06] text-amber-200",
  error: "border-rose-400/20 bg-rose-400/[0.06] text-rose-200",
};

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [form, setForm] = useState({ title: "", message: "", type: "info", audience: "all", status: "published" });
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    await Promise.resolve();
    setLoading(true);
    setError("");
    try {
      setNotifications(await getAdminNotifications({ pageSize: 500 }));
    } catch (nextError) {
      setError(nextError?.message ?? "Announcements could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(
    () => notifications.filter((item) => filter === "all" || item.status === filter),
    [notifications, filter],
  );

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleCreate(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await createAdminNotification(form);
      setForm((current) => ({ ...current, title: "", message: "" }));
      setSuccess(form.status === "published" ? "Announcement published to its selected audience." : "Announcement draft saved.");
      await load();
    } catch (nextError) {
      setError(nextError?.message ?? "The announcement could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive(item) {
    if (!window.confirm(`Archive “${item.title}”?`)) return;
    setArchiving(item.id);
    setError("");
    try {
      await archiveAdminNotification(item.id);
      setNotifications((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "archived", archivedAt: new Date() } : entry));
      setSuccess("Announcement archived.");
    } catch (nextError) {
      setError(nextError?.message ?? "The announcement could not be archived.");
    } finally {
      setArchiving("");
    }
  }

  async function handlePublishDraft(item) {
    setArchiving(item.id);
    setError("");
    try {
      await updateAdminNotification(item.id, {
        title: item.title,
        message: item.message,
        type: item.type,
        audience: item.audience,
        status: "published",
      });
      setNotifications((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: "published", publishedAt: new Date() } : entry));
      setSuccess("Draft announcement published.");
    } catch (nextError) {
      setError(nextError?.message ?? "The draft could not be published.");
    } finally {
      setArchiving("");
    }
  }

  if (loading && notifications.length === 0) return <LoadingState label="Loading announcement history…" />;

  const published = notifications.filter((item) => item.status === "published").length;
  const drafts = notifications.filter((item) => item.status === "draft").length;
  const customerNotices = notifications.filter((item) => item.status === "published" && ["all", "customers"].includes(item.audience)).length;

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Notification management" title="In-app announcements" description="Publish real notices to the customer site or save internal administrator announcements. This feature creates in-app records; it does not claim to send SMS, email, or push messages." />
      <ErrorBanner message={error} onRetry={load} />
      <SuccessBanner message={success} />

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Published" value={published} detail="Currently stored published records" color="emerald" symbol="N" />
        <MetricCard label="Customer notices" value={customerNotices} detail="Published to all or customers" color="blue" symbol="C" />
        <MetricCard label="Drafts" value={drafts} detail="Not visible outside admin" color="amber" symbol="D" />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.9fr_1.35fr]">
        <Panel title="Create announcement" description="Content is validated and stored by an admin-only Cloud Function.">
          <form onSubmit={handleCreate} className="space-y-4 p-5">
            <label className="block text-xs font-bold text-slate-300">Title<input required minLength={3} maxLength={120} value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Important platform update" className={`mt-2 ${inputClass}`} /></label>
            <label className="block text-xs font-bold text-slate-300">Message<textarea required minLength={5} maxLength={1000} rows={5} value={form.message} onChange={(event) => update("message", event.target.value)} placeholder="Write a clear, factual announcement…" className={`mt-2 py-3 ${inputClass}`} /></label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-bold text-slate-300">Type<select value={form.type} onChange={(event) => update("type", event.target.value)} className={`mt-2 ${inputClass}`}><option value="info">Information</option><option value="success">Success</option><option value="warning">Warning</option><option value="error">Urgent / error</option></select></label>
              <label className="text-xs font-bold text-slate-300">Audience<select value={form.audience} onChange={(event) => update("audience", event.target.value)} className={`mt-2 ${inputClass}`}><option value="all">Everyone</option><option value="customers">Customers</option><option value="admins">Administrators</option></select></label>
              <label className="text-xs font-bold text-slate-300">Publishing<select value={form.status} onChange={(event) => update("status", event.target.value)} className={`mt-2 ${inputClass}`}><option value="published">Publish now</option><option value="draft">Save draft</option></select></label>
            </div>
            <button type="submit" disabled={saving} className="min-h-11 w-full rounded-xl bg-emerald-400 text-sm font-extrabold text-[#07110d] hover:bg-emerald-300 disabled:opacity-50">{saving ? "Saving securely…" : form.status === "published" ? "Publish announcement" : "Save draft"}</button>
          </form>
        </Panel>

        <Panel
          title="Announcement history"
          description="Newest records first"
          action={<select value={filter} onChange={(event) => setFilter(event.target.value)} className={`min-h-9 w-36 ${inputClass}`}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>}
        >
          {filtered.length === 0 ? (
            <EmptyState title="No announcements in this view" description="The system does not create sample notifications." />
          ) : (
            <div className="divide-y divide-white/[0.06] px-5">
              {filtered.map((item) => (
                <article key={item.id} className="py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize ${TYPE_COLORS[item.type] ?? TYPE_COLORS.info}`}>{item.type}</span><StatusPill status={item.status} /><span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-bold capitalize text-slate-400">{item.audience}</span></div>
                    <span className="text-[10px] text-slate-600">{formatAdminTime(item.createdAt)}</span>
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-white">{item.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-400">{item.message}</p>
                  {item.status !== "archived" && <div className="mt-3 flex gap-4">{item.status === "draft" && <button type="button" disabled={archiving === item.id} onClick={() => handlePublishDraft(item)} className="text-[10px] font-bold text-emerald-300 hover:text-emerald-200 disabled:opacity-40">Publish draft</button>}<button type="button" disabled={archiving === item.id} onClick={() => handleArchive(item)} className="text-[10px] font-bold text-rose-300 hover:text-rose-200 disabled:opacity-40">Archive announcement</button></div>}
                </article>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}
