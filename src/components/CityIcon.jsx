const icons = {
  /* Monument / historic landmark */
  landmark: (
    <>
      <path d="M4 21h16M5 18h14M12 3 5 8h14l-7-5Z" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M7 8v10M12 8v10M17 8v10" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  /* Market stall with awning */
  market: (
    <>
      <path d="M4 9 5.5 4h13L20 9" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4 9a2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0 2.2 2.2 0 0 0 4 0" strokeWidth="1.4" />
      <path d="M5 11v9h14v-9M9 20v-5h6v5" strokeWidth="1.6" strokeLinejoin="round" />
    </>
  ),
  /* Tree + ground */
  park: (
    <>
      <path d="M12 3c-2.8 0-5 2.1-5 4.7 0 .6.1 1.2.3 1.7A4.3 4.3 0 0 0 5 13c0 2.4 2 4.3 4.4 4.3h5.2c2.4 0 4.4-1.9 4.4-4.3 0-1.4-.7-2.7-1.9-3.5.2-.5.3-1.1.3-1.7C17.4 5.1 15 3 12 3Z" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 9v11M8.5 20h7" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  /* Coffee jebena */
  culture: (
    <>
      <path d="M10 4h4M12 4c0 3-2.5 4-4.5 4.5C5.6 9 4 10.8 4 13.5 4 17 7.6 19.5 12 19.5s8-2.5 8-6c0-2.7-1.6-4.5-3.5-5C14.5 8 12 7 12 4Z" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="m19.2 11.4 2-1.3m-2.3 4.8 2.6.7" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M12 8.5c-1.5 0-3 .7-3 2.2" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4.5 21.5c2.3-1.3 4-1.3 6-.5s4 .8 6.5.5" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  /* Compass for map / directions */
  compass: (
    <>
      <circle cx="12" cy="12" r="9" strokeWidth="1.6" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" strokeWidth="1.4" strokeLinejoin="round" />
    </>
  ),
};

export default function CityIcon({ icon = "landmark", className = "h-5 w-5" }) {
  const paths = icons[icon] ?? icons.landmark;
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <g stroke="currentColor" strokeLinejoin="round">
        {paths}
      </g>
    </svg>
  );
}
