import Image from "next/image";

export default function SportsHero() {
  return (
    <section className="relative isolate flex min-h-[min(760px,88vh)] items-center overflow-hidden bg-slate-950">
      <Image
        src="/images/sports/hero-football.jpg"
        alt="Football pitch under stadium lights"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/35"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20"
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 py-24 sm:px-8 sm:py-28">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-950/60 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-200 backdrop-blur">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-amber-300" />
            Dire Dawa · Ethiopia
          </span>
          <h1 className="mt-6 text-4xl font-black leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Find Your Game.
            <span className="mt-1 block text-emerald-300">Book Your Place.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg sm:leading-8">
            Discover sports facilities across Dire Dawa, explore different activities,
            check facility details, and book your next game in one place.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="#facilities"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-400 px-7 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200/40"
            >
              Explore Sports Facilities
            </a>
            <a
              href="#sports"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/10 px-7 py-3 text-sm font-extrabold text-white backdrop-blur transition hover:border-amber-300/70 hover:bg-white/15 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/25"
            >
              Browse Sports Categories
            </a>
          </div>
          <p className="mt-8 text-xs font-semibold tracking-wide text-slate-300">
            Your City. Your Sport. Your Game.
          </p>
        </div>
      </div>
    </section>
  );
}
