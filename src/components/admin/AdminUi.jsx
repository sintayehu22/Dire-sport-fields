"use client";

import { formatEatTimestamp } from "@/src/lib/eatTime.mjs";

export const inputClass =
  "min-h-11 w-full rounded-xl border border-white/10 bg-[#07110d] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/50 focus:ring-4 focus:ring-emerald-400/10 disabled:cursor-not-allowed disabled:opacity-50";

export const panelClass =
  "rounded-2xl border border-white/[0.08] bg-[#0d1c16] shadow-[0_16px_45px_rgba(0,0,0,0.12)]";

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
      <div className="max-w-3xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-400">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">{title}</h1>
        {description && <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

const metricColors = {
  emerald: "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-300",
  amber: "border-amber-400/15 bg-amber-400/[0.07] text-amber-300",
  rose: "border-rose-400/15 bg-rose-400/[0.07] text-rose-300",
  blue: "border-sky-400/15 bg-sky-400/[0.07] text-sky-300",
  violet: "border-violet-400/15 bg-violet-400/[0.07] text-violet-300",
};

export function MetricCard({ label, value, detail, color = "emerald", symbol = "•" }) {
  return (
    <article className={`${panelClass} p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
          <p className="mt-2 break-words text-2xl font-black tracking-tight text-white sm:text-3xl">{value}</p>
          {detail && <p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p>}
        </div>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black ${metricColors[color] ?? metricColors.emerald}`}>
          {symbol}
        </span>
      </div>
    </article>
  );
}

export function Panel({ title, description, action, children, className = "" }) {
  return (
    <section className={`${panelClass} ${className}`}>
      {(title || action) && (
        <div className="flex flex-col justify-between gap-3 border-b border-white/[0.07] px-5 py-4 sm:flex-row sm:items-center">
          <div>
            {title && <h2 className="text-sm font-bold text-white">{title}</h2>}
            {description && <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const STATUS_STYLES = {
  confirmed: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  paid: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  approved: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  published: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  active: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  resolved: "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
  pending: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  pending_payment: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  processing: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  manual_review: "border-amber-400/20 bg-amber-400/10 text-amber-200",
  new: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  read: "border-sky-400/20 bg-sky-400/10 text-sky-200",
  draft: "border-slate-400/20 bg-slate-400/10 text-slate-300",
  unpaid: "border-slate-400/20 bg-slate-400/10 text-slate-300",
  cancelled: "border-slate-400/20 bg-slate-400/10 text-slate-300",
  archived: "border-slate-400/20 bg-slate-400/10 text-slate-300",
  expired: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  failed: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  rejected: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  blocked: "border-rose-400/20 bg-rose-400/10 text-rose-200",
  refunded: "border-violet-400/20 bg-violet-400/10 text-violet-200",
};

export function StatusPill({ status, label }) {
  const key = String(status ?? "unknown");
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-bold capitalize ${STATUS_STYLES[key] ?? "border-white/10 bg-white/5 text-slate-300"}`}>
      {label ?? key.replaceAll("_", " ")}
    </span>
  );
}

export function ErrorBanner({ message, onRetry }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex flex-col justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200 sm:flex-row sm:items-center">
      <span>{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="shrink-0 text-xs font-bold text-white underline underline-offset-4">
          Try again
        </button>
      )}
    </div>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
      {message}
    </p>
  );
}

export function LoadingState({ label = "Loading live platform data…" }) {
  return (
    <div className={`${panelClass} flex min-h-56 items-center justify-center p-8`}>
      <div className="text-center">
        <span className="mx-auto block h-7 w-7 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400" />
        <p className="mt-3 text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export function EmptyState({ title, description }) {
  return (
    <div className="px-5 py-12 text-center">
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-slate-500">—</span>
      <p className="mt-3 text-sm font-bold text-slate-200">{title}</p>
      {description && <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">{description}</p>}
    </div>
  );
}

export function formatAdminTime(value) {
  if (!value) return "—";
  const formatted = formatEatTimestamp(value);
  return formatted || "—";
}

export function formatMoney(value) {
  return `${(Number(value) || 0).toLocaleString("en-US")} ETB`;
}

export function shortId(value, visible = 9) {
  const text = String(value ?? "");
  return text.length > visible * 2 + 1
    ? `${text.slice(0, visible)}…${text.slice(-visible)}`
    : text;
}
