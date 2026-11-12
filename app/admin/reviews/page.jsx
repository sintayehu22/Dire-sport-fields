"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getAllFeedback,
  getAllReviews,
  moderateReview,
  updateFeedback,
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
  shortId,
} from "@/src/components/admin/AdminUi";

function Stars({ rating }) {
  return <span className="tracking-wider text-amber-300" aria-label={`${rating} out of 5 stars`}>{"★".repeat(Number(rating) || 0)}{"☆".repeat(Math.max(0, 5 - (Number(rating) || 0)))}</span>;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [tab, setTab] = useState("reviews");
  const [status, setStatus] = useState("all");
  const [queryText, setQueryText] = useState("");
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
      const [reviewData, feedbackData] = await Promise.all([
        getAllReviews({ pageSize: 1_000 }),
        getAllFeedback({ pageSize: 1_000 }),
      ]);
      setReviews(reviewData);
      setFeedback(feedbackData);
    } catch (nextError) {
      setError(nextError?.message ?? "Reviews and feedback could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(load, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const records = tab === "reviews" ? reviews : feedback;
  const filtered = useMemo(() => {
    const search = queryText.trim().toLowerCase();
    return records.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      return !search || [item.id, item.facilityName, item.customerName, item.name, item.email, item.comment, item.message, item.category].join(" ").toLowerCase().includes(search);
    });
  }, [records, queryText, status]);

  async function handleReview(review, nextStatus) {
    setUpdating(review.id);
    setError("");
    try {
      await moderateReview({ reviewId: review.id, status: nextStatus, adminNote: notes[review.id] ?? "" });
      setReviews((current) => current.map((item) => item.id === review.id ? { ...item, status: nextStatus, adminNote: notes[review.id] ?? "", moderatedAt: new Date() } : item));
      setSuccess(`Review ${nextStatus}. Facility rating aggregates were updated transactionally.`);
    } catch (nextError) {
      setError(nextError?.message ?? "The review could not be moderated.");
    } finally {
      setUpdating("");
    }
  }

  async function handleFeedback(item, nextStatus) {
    setUpdating(item.id);
    setError("");
    try {
      await updateFeedback({ feedbackId: item.id, status: nextStatus, adminNote: notes[item.id] ?? "" });
      setFeedback((current) => current.map((entry) => entry.id === item.id ? { ...entry, status: nextStatus, adminNote: notes[item.id] ?? "", updatedAt: new Date() } : entry));
      setSuccess(`Feedback marked ${nextStatus}.`);
    } catch (nextError) {
      setError(nextError?.message ?? "Feedback could not be updated.");
    } finally {
      setUpdating("");
    }
  }

  if (loading && records.length === 0) return <LoadingState label="Loading customer reviews and feedback…" />;

  const pendingReviews = reviews.filter((item) => item.status === "pending").length;
  const approvedReviews = reviews.filter((item) => item.status === "approved").length;
  const newFeedback = feedback.filter((item) => item.status === "new").length;
  const average = approvedReviews
    ? reviews.filter((item) => item.status === "approved").reduce((sum, item) => sum + Number(item.rating || 0), 0) / approvedReviews
    : 0;

  const statusOptions = tab === "reviews" ? ["pending", "approved", "rejected"] : ["new", "read", "resolved"];

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Reviews and feedback" title="Customer voice" description="Moderate verified-booking reviews and manage direct platform feedback. Reviews remain private until an administrator approves them; no rating is generated without a real customer submission." actions={<button type="button" onClick={load} disabled={loading} className="min-h-10 rounded-xl border border-white/10 px-4 text-xs font-bold text-slate-300 hover:bg-white/5 disabled:opacity-50">{loading ? "Refreshing…" : "Refresh"}</button>} />
      <ErrorBanner message={error} onRetry={load} />
      <SuccessBanner message={success} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending reviews" value={pendingReviews} detail="Awaiting moderation" color="amber" symbol="R" />
        <MetricCard label="Published reviews" value={approvedReviews} detail="Visible on facility pages" color="emerald" symbol="✓" />
        <MetricCard label="Published average" value={approvedReviews ? average.toFixed(1) : "—"} detail="Approved reviews only" color="violet" symbol="★" />
        <MetricCard label="New feedback" value={newFeedback} detail="Unread customer messages" color="blue" symbol="F" />
      </section>

      <Panel>
        <div className="flex flex-col gap-4 p-4 xl:flex-row xl:items-center">
          <div className="flex gap-2">
            <button type="button" onClick={() => { setTab("reviews"); setStatus("all"); }} className={`min-h-10 rounded-xl border px-4 text-xs font-bold ${tab === "reviews" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>Reviews ({reviews.length})</button>
            <button type="button" onClick={() => { setTab("feedback"); setStatus("all"); }} className={`min-h-10 rounded-xl border px-4 text-xs font-bold ${tab === "feedback" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-white/10 text-slate-400 hover:bg-white/5"}`}>Feedback ({feedback.length})</button>
          </div>
          <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_13rem] xl:ml-auto xl:max-w-2xl">
            <input type="search" value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder={`Search ${tab}…`} className={inputClass} />
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={inputClass}><option value="all">All statuses</option>{statusOptions.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          </div>
        </div>
      </Panel>

      <Panel title={`${filtered.length} ${tab === "reviews" ? "review" : "feedback message"}${filtered.length === 1 ? "" : "s"}`}>
        {filtered.length === 0 ? (
          <EmptyState title={`No ${tab} match`} description={`Real customer ${tab} will appear here after submission.`} />
        ) : (
          <div className="grid gap-4 p-4 lg:grid-cols-2">
            {tab === "reviews" ? filtered.map((review) => (
              <article key={review.id} className="rounded-2xl border border-white/[0.08] bg-[#091510] p-5">
                <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-white">{review.facilityName}</p><p className="mt-1 text-xs text-slate-500">{review.customerName} · booking {shortId(review.bookingId)}</p></div><StatusPill status={review.status} /></div>
                <div className="mt-3 text-sm"><Stars rating={review.rating} /></div>
                <blockquote className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">“{review.comment}”</blockquote>
                <p className="mt-3 text-[10px] text-slate-600">Submitted {formatAdminTime(review.createdAt)}</p>
                <label className="mt-4 block text-xs font-semibold text-slate-400">Moderation note<textarea rows={2} value={notes[review.id] ?? review.adminNote ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [review.id]: event.target.value }))} className={`mt-2 py-2 ${inputClass}`} /></label>
                <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={updating === review.id || review.status === "rejected"} onClick={() => handleReview(review, "rejected")} className="min-h-10 rounded-xl border border-rose-400/25 text-xs font-bold text-rose-200 hover:bg-rose-400/10 disabled:opacity-40">Reject</button><button type="button" disabled={updating === review.id || review.status === "approved"} onClick={() => handleReview(review, "approved")} className="min-h-10 rounded-xl bg-emerald-400 text-xs font-extrabold text-[#07110d] hover:bg-emerald-300 disabled:opacity-40">Approve & publish</button></div>
              </article>
            )) : filtered.map((item) => (
              <article key={item.id} className="rounded-2xl border border-white/[0.08] bg-[#091510] p-5">
                <div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-white">{item.name}</p><p className="mt-1 break-all text-xs text-slate-500">{item.email} · <span className="capitalize">{item.category}</span></p></div><StatusPill status={item.status} /></div>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.message}</p>
                <p className="mt-3 text-[10px] text-slate-600">Submitted {formatAdminTime(item.createdAt)} · {shortId(item.id)}</p>
                <label className="mt-4 block text-xs font-semibold text-slate-400">Internal response note<textarea rows={2} value={notes[item.id] ?? item.adminNote ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} className={`mt-2 py-2 ${inputClass}`} /></label>
                <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" disabled={updating === item.id || item.status === "read" || item.status === "resolved"} onClick={() => handleFeedback(item, "read")} className="min-h-10 rounded-xl border border-sky-400/20 text-xs font-bold text-sky-200 hover:bg-sky-400/10 disabled:opacity-40">Mark read</button><button type="button" disabled={updating === item.id || item.status === "resolved"} onClick={() => handleFeedback(item, "resolved")} className="min-h-10 rounded-xl bg-emerald-400 text-xs font-extrabold text-[#07110d] hover:bg-emerald-300 disabled:opacity-40">Resolve</button></div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
