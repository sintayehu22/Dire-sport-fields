import Image from "next/image";
import { facilities } from "@/src/lib/facilities";
import { CITY_LANDMARKS, CITY_MARKETS, CITY_PARKS } from "@/src/lib/city";

function ChevronDown() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PinIcon({ className = "h-4 w-4" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

const HERO_STATS = [
  {
    value: `${facilities.length}`,
    label: "sport facilities",
  },
  {
    value: `${CITY_LANDMARKS.length}`,
    label: "famous landmarks",
  },
  {
    value: `${CITY_MARKETS.length}`,
    label: "markets",
  },
  {
    value: `${CITY_PARKS.length}`,
    label: "parks & gardens",
  },
];

export default function CityHero({ onFindNearMe }) {
  function handleNearMeClick() {
    onFindNearMe?.();
    document.querySelector("#facilities")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden">
      <Image
        src="/images/city/railway-station.jpg"
        alt="The historic Dire Dawa railway station, built when the Franco-Ethiopian railway reached the city in 1902"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/70 to-slate-950/30"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/40"
      />

      <div className="relative mx-auto w-full max-w-7xl px-5 py-24 sm:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amber-300 backdrop-blur">
            Dire Dawa · Ethiopia
            <span aria-hidden="true" className="text-white/40">
              ✦
            </span>
            <span className="text-white/70">city of play</span>
          </span>

          <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-white font-display sm:text-6xl lg:text-7xl">
            Discover Dire Dawa.
            <span className="block text-transparent bg-gradient-to-r from-emerald-300 via-amber-200 to-amber-400 bg-clip-text">
              Play, Explore &amp; Enjoy.
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg sm:leading-9">
            Find sports facilities, discover famous places, explore local culture and
            enjoy everything Dire Dawa has to offer.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#sports"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 text-sm font-extrabold text-slate-950 shadow-[0_15px_40px_rgba(16,185,129,0.35)] transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/30"
            >
              Explore Sports
            </a>
            <a
              href="#discover"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-extrabold text-white backdrop-blur transition hover:border-amber-300/60 hover:bg-amber-300/15 hover:text-amber-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
            >
              Discover Dire Dawa
            </a>
            <button
              type="button"
              onClick={handleNearMeClick}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-bold text-slate-200 transition hover:border-emerald-400/50 hover:bg-emerald-400/10 hover:text-emerald-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/20"
            >
              <PinIcon />
              Find Facilities Near Me
            </button>
          </div>

          <dl className="mt-14 grid max-w-xl grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4">
            {HERO_STATS.map((stat) => (
              <div key={stat.label}>
                <dt className="text-3xl font-black text-white font-display">{stat.value}</dt>
                <dd className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <a
        href="#sports"
        aria-label="Scroll to sports categories"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full p-2 text-slate-300 transition hover:text-amber-300"
      >
        <ChevronDown />
      </a>
    </section>
  );
}
