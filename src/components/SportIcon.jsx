"use client";

const iconClass = "h-5 w-5";

const ICONS = {
  football: (
    <>
      <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
      <path
        d="m9 8 3-2 3 2-1 3h-4L9 8Zm-1 7 2-4m6 4-2-4m-3 5v-4m-4 3 4 3 4-3"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </>
  ),
  basketball: (
    <>
      <circle cx="12" cy="12" r="9" strokeWidth="1.6" />
      <path
        d="M12 3v18M3 12h18M5.2 5.5c4 2.5 9.6 2.5 13.6 0M5.2 18.5c4-2.5 9.6-2.5 13.6 0"
        strokeWidth="1.4"
      />
    </>
  ),
  volleyball: (
    <>
      <circle cx="12" cy="12" r="9" strokeWidth="1.6" />
      <path
        d="M12 3c-1.5 5 0 10 4.5 13.5M12 3c1.5 5 0 10-4.5 13.5M3.4 9.5c4.5 1.5 12.7 1.5 17.2 0"
        strokeWidth="1.4"
      />
    </>
  ),
};

export default function SportIcon({ sport, className = iconClass }) {
  const paths = ICONS[sport] ?? ICONS.football;
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeLinejoin="round">
        {paths}
      </g>
    </svg>
  );
}
