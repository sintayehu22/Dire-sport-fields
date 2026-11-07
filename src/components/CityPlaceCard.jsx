import Image from "next/image";
import Link from "next/link";
import CityIcon from "@/src/components/CityIcon";
import { cityMapsUrl } from "@/src/lib/city";

function PinIcon({ className = "h-3.5 w-3.5" }) {
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

function ArrowIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className={className}>
      <path
        d="M4 10h12m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const KIND_STYLES = {
  landmark: {
    chip: "bg-amber-400/15 text-amber-300 border-amber-400/25",
    icon: "text-amber-400",
    solidBtn: "bg-amber-400 hover:bg-amber-300 text-slate-950",
    placeholderA: "from-stone-800 via-stone-900 to-slate-950",
    placeholderIcon: "text-amber-400/50",
  },
  market: {
    chip: "bg-orange-500/15 text-orange-300 border-orange-500/25",
    solidBtn: "bg-orange-500 hover:bg-orange-400 text-slate-950",
    icon: "text-orange-400",
    placeholderA: "from-stone-700 via-stone-800 to-slate-950",
    placeholderIcon: "text-orange-400/50",
  },
  park: {
    chip: "bg-lime-400/15 text-lime-300 border-lime-400/25",
    solidBtn: "bg-lime-400 hover:bg-lime-300 text-slate-950",
    icon: "text-lime-400",
    placeholderA: "from-emerald-900 via-emerald-950 to-slate-950",
    placeholderIcon: "text-lime-300/50",
  },
};

const LIGHT_OVERRIDES = {
  card: "border-stone-300/70 bg-white shadow-[0_10px_35px_rgba(60,44,20,0.08)] hover:border-amber-400/60",
  name: "text-slate-900",
  tagline: "text-amber-700",
  body: "text-stone-600",
  meta: "text-stone-500",
  secondaryBtn:
    "border-stone-300 bg-white/[0.03] text-stone-800 hover:border-amber-500/60 hover:bg-amber-500/10",
  credit: "text-stone-400",
};

const DARK_OVERRIDES = {
  card: "border-white/10 bg-slate-900 hover:border-amber-400/30 hover:shadow-[0_20px_55px_rgba(0,0,0,0.4)]",
  name: "text-white",
  tagline: "text-amber-300",
  body: "text-slate-400",
  meta: "text-slate-500",
  secondaryBtn:
    "border-white/15 bg-white/[0.04] text-white hover:border-amber-400/50 hover:bg-white/[0.08]",
  credit: "text-slate-600",
};

/**
 * Reusable Dire Dawa place card (landmark, market, or park).
 * Renders a real photo when verified, otherwise a designed
 * "photo coming soon" tile — never a stand-in image of another place.
 */
export default function CityPlaceCard({ place, tone = "dark" }) {
  const style = KIND_STYLES[place.kind] ?? KIND_STYLES.landmark;
  const o = tone === "light" ? LIGHT_OVERRIDES : DARK_OVERRIDES;

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-3xl border transition duration-200 hover:-translate-y-1 ${o.card}`}
    >
      <div className="relative h-44 overflow-hidden">
        {place.photo ? (
          <Image
            src={place.photo.src}
            alt={place.photo.alt}
            width={768}
            height={432}
            loading="lazy"
            className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden="true"
            className={`flex h-44 w-full items-center justify-center bg-gradient-to-br ${style.placeholderA} transition duration-500 group-hover:scale-[1.03]`}
          >
            <CityIcon
              icon={place.kind}
              className={`h-12 w-12 opacity-60 ${style.placeholderIcon}`}
            />
          </div>
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border bg-slate-950/75 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] backdrop-blur ${style.chip}`}
          >
            <CityIcon icon={place.kind} className="h-3 w-3" />
            {place.kindLabel}
          </span>
        </div>
        <span className="absolute inset-x-3 bottom-3 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 backdrop-blur">
          <PinIcon className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          {place.neighborhood}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className={`text-lg font-bold leading-snug tracking-tight font-display ${o.name}`}>
            {place.name}
            {place.nativeName && (
              <span className={`ml-1.5 text-base font-bold ${o.meta}`}>{place.nativeName}</span>
            )}
          </h3>
          <p className={`mt-0.5 text-xs font-bold ${o.tagline}`}>{place.tagline}</p>
        </div>

        <p className={`text-sm leading-6 ${o.body}`}>{place.description}</p>

        <div className="mt-auto grid grid-cols-1 gap-2">
          <a
            href={cityMapsUrl(place)}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/25 ${style.solidBtn}`}
          >
            <CityIcon icon="compass" className="h-4 w-4" />
            Explore Location <ArrowIcon />
          </a>
          {place.facilityId ? (
            <Link
              href={`/facilities/${place.facilityId}`}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition ${o.secondaryBtn}`}
            >
              Facility & booking details <ArrowIcon className="h-3 w-3" />
            </Link>
          ) : null}
        </div>

        {place.photo && (
          <p className={`text-[10px] leading-4 ${o.credit}`}>{place.photo.credit}</p>
        )}
        {place.photo?.sceneNote && (
          <p className={`text-[10px] leading-4 font-semibold ${o.credit}`}>
            Not the exact venue — {place.photo.sceneNote.toLowerCase()}
          </p>
        )}
      </div>
    </article>
  );
}
