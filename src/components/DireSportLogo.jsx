export default function DireSportLogo({ className = "h-10 w-10", tone = "dark" }) {
  const wordmarkColor = tone === "light" ? "text-slate-950" : "text-white";

  return (
    <span className="inline-flex items-center gap-3">
      <svg
        viewBox="0 0 56 56"
        fill="none"
        className={className}
        aria-hidden="true"
      >
        <rect x="1" y="1" width="54" height="54" rx="17" fill="#047857" />
        <path
          d="M12 19h32v22H12zM28 19v22M28 26a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
          stroke="#d1fae5"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M12 26h5v8h-5m32-8h-5v8h5" stroke="#d1fae5" strokeWidth="1.5" />
        <path
          d="M16 17v-3h5v3m2 0V9h5v8m2 0v-5h5v5m2 0v-2h4v2"
          stroke="#fcd34d"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="28" cy="30" r="6" fill="#fff" />
        <path
          d="m28 26.4 2.2 1.6-.8 2.6h-2.8l-.8-2.6 2.2-1.6Zm-3.1 2.2-2.1-.1m8.6 0 2.1-.1m-6.2 2.1-1 2m3.3-2 1 2"
          stroke="#065f46"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={`leading-tight ${wordmarkColor}`}>
        <span className="block text-sm font-extrabold tracking-tight sm:text-base">
          Dire Sport <span className="text-emerald-400">Fields</span>
        </span>
        <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.16em] opacity-60">
          Dire Dawa · Ethiopia
        </span>
      </span>
    </span>
  );
}
