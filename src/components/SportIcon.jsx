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
  tennis: (
    <>
      <ellipse
        cx="10.5"
        cy="7.5"
        rx="4.2"
        ry="6.2"
        strokeWidth="1.6"
        transform="rotate(-38 10.5 7.5)"
      />
      <path d="m8.2 13.6-3.4 6.4" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="18" cy="17" r="3" strokeWidth="1.6" />
    </>
  ),
  badminton: (
    <>
      <circle cx="7" cy="17" r="2.5" strokeWidth="1.6" />
      <path
        d="M8.8 15.2 13.5 6.5M11 17.4 16.5 9M7.6 14.5 9.5 5.5"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M9.5 5.5 13.5 6.5 16.5 9"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </>
  ),
  swimming: (
    <>
      <path
        d="M3 19c1.8 1.4 3.9 1.4 5.7 0 1.8-1.4 3.9-1.4 5.7 0 1.8 1.4 3.9 1.4 5.7 0"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="18.5" cy="9.5" r="2.2" strokeWidth="1.6" />
      <path
        d="M3 16.5 9.5 13c.8 1.6 3 2.4 5 1.6L20 12"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  gym: (
    <>
      <path d="M6.5 4v16M17.5 4v16M3.5 8v8M20.5 8v8M6.5 12h11" strokeWidth="2.1" strokeLinecap="round" />
    </>
  ),
  handball: (
    <>
      <path
        d="M3.5 5h14.3l.2 15.5"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M3.5 5v15.5M3.5 20.5h14.5M7.5 5v15.5M11 5v15.5M14.5 5v15.5M3.5 9h14.7M3.5 13h14.7M3.5 17h14.7"
        strokeWidth="0.9" />
      <circle cx="18.5" cy="4.5" r="2" strokeWidth="1.5" />
    </>
  ),
  recreation: (
    <>
      <path
        d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M18.5 15.5l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6ZM5 17.5l.6 1.7 1.7.6-1.7.6-.6 1.7-.6-1.7-1.7-.6 1.7-.6.6-1.7Z"
        strokeWidth="1.2"
        strokeLinejoin="round"
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
