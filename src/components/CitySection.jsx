const TONES = {
  dark: {
    wrap: "bg-slate-950",
    eyebrow: "text-emerald-400",
    title: "text-white",
    sub: "text-slate-400",
  },
  darker: {
    wrap: "bg-slate-900/40",
    eyebrow: "text-emerald-400",
    title: "text-white",
    sub: "text-slate-400",
  },
  light: {
    wrap: "bg-[#f7f4ec]",
    eyebrow: "text-amber-700",
    title: "text-slate-950",
    sub: "text-slate-600",
  },
  warm: {
    wrap: "bg-[#171310]",
    eyebrow: "text-amber-400",
    title: "text-white",
    sub: "text-stone-400",
  },
};

export default function CitySection({
  id,
  tone = "dark",
  className = "",
  eyebrow,
  title,
  subtitle,
  align = "left",
  children,
}) {
  const t = TONES[tone] ?? TONES.dark;
  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      <div className={`mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 ${t.wrap}`}>
        <div
          className={`${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-3xl"}`}
        >
          {eyebrow && (
            <p className={`text-xs font-bold uppercase tracking-[0.2em] ${t.eyebrow}`}>
              {eyebrow}
            </p>
          )}
          <h2
            className={`mt-2 text-3xl font-black tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1] font-display ${t.title}`}
          >
            {title}
          </h2>
          {subtitle && (
            <p className={`mt-3 text-sm leading-7 sm:text-base ${t.sub}`}>{subtitle}</p>
          )}
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}
