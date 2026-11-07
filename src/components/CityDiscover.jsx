import Image from "next/image";
import CitySection from "@/src/components/CitySection";

function DiscoverTile({ tile, className = "" }) {
  return (
    <figure
      className={`group relative flex flex-col overflow-hidden rounded-3xl border border-stone-300/70 bg-white shadow-[0_10px_35px_rgba(60,44,20,0.08)] transition duration-200 hover:-translate-y-1 hover:border-amber-400/60 ${className}`}
    >
      <Image
        src={tile.src}
        alt={tile.alt}
        width={768}
        height={432}
        loading="lazy"
        className={`w-full object-cover transition duration-500 group-hover:scale-105 ${tile.tall ? "h-72" : "h-52"}`}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-slate-950/55 to-transparent"
      />
      <figcaption className="flex flex-1 flex-col gap-1.5 p-5">
        <span className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-amber-700">
          {tile.label}
        </span>
        <h3 className="text-lg font-bold tracking-tight text-slate-900 font-display">
          {tile.title}
        </h3>
        <p className="text-sm leading-6 text-stone-600">{tile.text}</p>
      </figcaption>
    </figure>
  );
}

const TILES = [
  {
    src: "/images/city/downtown.jpg",
    alt: "A horse-drawn cart crossing a roundabout in central Dire Dawa",
    label: "Kesatama Ber",
    title: "The roundabout heart of the city",
    text: "Horse carts still circle the statue at Kesatama Ber, where Kezira and Megala meet — Dire Dawa's daily rhythm on display.",
    tall: false,
  },
  {
    src: "/images/city/station-square.jpg",
    alt: "The square beside the historic Dire Dawa railway station",
    label: "Station square",
    title: "Born of the railway",
    text: "The city grew up around the Franco-Ethiopian railway, which reached this site in 1902 — the station is still its proudest monument.",
    tall: false,
  },
  {
    src: "/images/city/kefira-road.jpg",
    alt: "A quiet stone-built street in the Kefira quarter of Dire Dawa",
    label: "Kefira",
    title: "Kezira's quieter cousin",
    text: "Wander off the main roads and you'll find calm, tree-shaded streets decked with green shutters in the Kefira quarter.",
    tall: true,
  },
];

export default function CityDiscover() {
  return (
    <div className="border-y border-stone-200">
      <CitySection
        id="discover"
        tone="light"
        eyebrow="Discover Dire Dawa"
        title="A railway city with a soul of its own"
        subtitle="Straddling the line between the highlands and the Ogaden desert, Dire Dawa grew from a railway construction camp in 1902 into Ethiopia's second-largest city — a relaxed, whitewashed place where commuter trains, bajajs and horse carts share one unhurried street scene."
      >
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 lg:row-span-1">
            <DiscoverTile tile={TILES[2]} className="h-full" />
          </div>
          <div className="grid gap-6 lg:col-span-7">
            <DiscoverTile tile={TILES[0]} />
            <DiscoverTile tile={TILES[1]} />
          </div>
        </div>

        <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-stone-300/70 bg-stone-300/70 sm:grid-cols-3">
          <div className="bg-white p-5">
            <p className="text-sm font-extrabold text-slate-900">Founded in 1902</p>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              The railway gave Dire Dawa its grid of straight streets — unusual for an
              Ethiopian city, unmistakably Dire.
            </p>
          </div>
          <div className="bg-white p-5">
            <p className="text-sm font-extrabold text-slate-900">Cafés &amp; street life</p>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              From legendary morning coffee houses to evening spots around the station,
              the city keeps its own easygoing pace.
            </p>
          </div>
          <div className="bg-white p-5">
            <p className="text-sm font-extrabold text-slate-900">Made &amp; traded here</p>
            <p className="mt-1 text-sm leading-6 text-stone-600">
              Khat markets, handmade baskets and industrial workshops give Dire Dawa a
              working, creative economy all its own.
            </p>
          </div>
        </div>
      </CitySection>
    </div>
  );
}
