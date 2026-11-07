"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import CityIcon from "@/src/components/CityIcon";
import CitySection from "@/src/components/CitySection";
import SportIcon from "@/src/components/SportIcon";
import { facilities, pricingLabel } from "@/src/lib/facilities";
import { CITY_PLACES, cityMapEmbedUrl, cityMapsUrl } from "@/src/lib/city";

const TABS = [
  { value: "all", label: "All" },
  { value: "sports", label: "Sports" },
  { value: "landmarks", label: "Landmarks" },
  { value: "markets", label: "Markets" },
  { value: "parks", label: "Parks" },
];

const KIND = {
  sports: {
    icon: (className) => <SportIcon sport="football" className={className} />,
    chip: "bg-emerald-400 text-slate-950",
    iconColor: "text-emerald-400",
    ringActive: "border-emerald-400/50 bg-emerald-400/10",
    textActive: "text-emerald-300",
    kindLabel: "Sport facility",
  },
  landmark: {
    icon: (className) => <CityIcon icon="landmark" className={className} />,
    chip: "bg-amber-400 text-slate-950",
    iconColor: "text-amber-400",
    ringActive: "border-amber-400/50 bg-amber-400/10",
    textActive: "text-amber-300",
    kindLabel: "Famous landmark",
  },
  market: {
    icon: (className) => <CityIcon icon="market" className={className} />,
    chip: "bg-orange-500 text-slate-950",
    iconColor: "text-orange-400",
    ringActive: "border-orange-500/50 bg-orange-500/10",
    textActive: "text-orange-300",
    kindLabel: "Market",
  },
  park: {
    icon: (className) => <CityIcon icon="park" className={className} />,
    chip: "bg-lime-400 text-slate-950",
    iconColor: "text-lime-400",
    ringActive: "border-lime-400/50 bg-lime-400/10",
    textActive: "text-lime-300",
    kindLabel: "Park & recreation",
  },
};

const facilityEmbedUrl = (facility) =>
  `https://maps.google.com/maps?q=${facility.latitude}%2C${facility.longitude}&z=15&output=embed`;

function UnpositionedBlock({ unpositioned }) {
  if (unpositioned.length === 0) return null;
  return (
    <div className="mt-3 rounded-2xl border border-dashed border-white/10 p-3.5">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        No verified pin yet
      </p>
      <ul className="mt-2 space-y-1.5">
        {unpositioned.map((facility) => (
          <li key={facility.id} className="text-sm text-slate-400">
            {facility.name}
            <span className="text-slate-600">
              {" "}
              —{" "}
              {facility.googleMapsUrl ? (
                <a
                  href={facility.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-500 underline decoration-dotted hover:text-emerald-400"
                >
                  search by name
                </a>
              ) : (
                "location to be confirmed"
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PlaceOverlay({ place }) {
  const style = KIND[place.kind];
  return (
    <div className="flex items-center gap-3">
      {place.photo ? (
        <Image
          src={place.photo.src}
          alt={place.photo.alt}
          width={112}
          height={112}
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-xl border border-white/10 object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950 ${style.iconColor}`}
        >
          {style.icon("h-6 w-6")}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white">{place.name}</p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
          <span className={`font-semibold ${style.textActive}`}>{style.kindLabel}</span>
          <span>·</span>
          <span className="truncate">{place.neighborhood}</span>
        </p>
        <p className="mt-0.5 truncate text-[11px] text-slate-500">
          Location shown by name search — verify on arrival
        </p>
      </div>
    </div>
  );
}

export default function CityMap({ onBook }) {
  const mappedFacilities = useMemo(
    () => facilities.filter((facility) => facility.latitude !== null),
    [],
  );
  const unpositioned = facilities.filter((facility) => facility.latitude === null);

  const [tab, setTab] = useState("all");
  const [active, setActive] = useState(() => ({
    type: "facility",
    id: mappedFacilities[0]?.id ?? CITY_PLACES[0]?.id,
  }));

  const visible = useMemo(() => {
    const facilityItems =
      tab === "all" || tab === "sports" ? mappedFacilities : [];
    const placeItems = CITY_PLACES.filter(
      (place) => tab === "all" || place.kind === tab,
    );
    return [
      ...facilityItems.map((facility) => ({ type: "facility", kind: "sports", facility })),
      ...placeItems.map((place) => ({ type: "place", kind: place.kind, place })),
    ];
  }, [tab, mappedFacilities]);

  const activeItem =
    active && visible.find((item) => item.type === active.type && item.id === active.id)
      ? active
      : (visible.find((item) => item.type === active?.type) ?? visible[0] ?? null);

  const counts = {
    sports: mappedFacilities.length,
    landmarks: CITY_PLACES.filter((place) => place.kind === "landmark").length,
    markets: CITY_PLACES.filter((place) => place.kind === "market").length,
    parks: CITY_PLACES.filter((place) => place.kind === "park").length,
  };

  return (
    <section id="map" className="scroll-mt-24">
      <CitySection
        tone="warm"
        eyebrow="Explore Dire Dawa on the map"
        title="Every pin, one map"
        subtitle="Sport facilities with verified coordinates side by side with the city’s landmarks, markets and parks. Pick a tab, then preview what you’ll find when you get there."
      >
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={tab === t.value}
              onClick={() => setTab(t.value)}
              className={`rounded-full border px-4 py-2 text-xs font-bold transition ${
                tab === t.value
                  ? "border-amber-400/60 bg-amber-400/15 text-amber-300"
                  : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/25 hover:text-white"
              }`}
            >
              {t.label}
              <span className={`ml-2 ${tab === t.value ? "" : "text-slate-500"}`}>
                {t.value === "all" ? counts.sports + CITY_PLACES.length : counts[t.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
            {activeItem && (
              <iframe
                key={`${activeItem.type}-${activeItem.id}`}
                title={
                  activeItem.type === "facility"
                    ? `Google map showing ${activeItem.facility.name} in Dire Dawa`
                    : `Google map showing ${activeItem.place.name} in Dire Dawa`
                }
                src={
                  activeItem.type === "facility"
                    ? facilityEmbedUrl(activeItem.facility)
                    : cityMapEmbedUrl(activeItem.place)
                }
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[24rem] w-full border-0 sm:h-[28rem]"
              />
            )}

            {activeItem && (
              <div className="absolute inset-x-4 bottom-4 flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/90 p-3 shadow-2xl backdrop-blur sm:inset-x-5 sm:p-4">
                {activeItem.type === "facility" ? (
                  <>
                    <div className="flex items-center gap-3">
                      <Image
                        src={activeItem.facility.images[0]}
                        alt={`Photo of ${activeItem.facility.name}`}
                        width={112}
                        height={112}
                        className="h-14 w-14 shrink-0 rounded-xl border border-white/10 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          {activeItem.facility.name}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-400">
                          <span className="inline-flex items-center gap-1">
                            <SportIcon sport={activeItem.facility.category} className="h-3 w-3 shrink-0 text-emerald-400" />
                            {activeItem.facility.neighborhood}
                          </span>
                          <span>·</span>
                          <span className="font-semibold text-emerald-400">
                            {pricingLabel(activeItem.facility)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
                      <Link
                        href={`/facilities/${activeItem.facility.id}`}
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-bold text-white transition hover:border-emerald-400/50 hover:bg-white/[0.08]"
                      >
                        View Details
                      </Link>
                      <button
                        type="button"
                        onClick={() => onBook(activeItem.facility)}
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-emerald-400"
                      >
                        Book Now
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <PlaceOverlay place={activeItem.place} />
                    <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
                      {activeItem.place.facilityId ? (
                        <Link
                          href={`/facilities/${activeItem.place.facilityId}`}
                          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.05] px-3 py-2 text-xs font-bold text-white transition hover:border-lime-400/60 hover:bg-white/[0.08]"
                        >
                          Facility details
                        </Link>
                      ) : null}
                      <a
                        href={cityMapsUrl(activeItem.place)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-amber-300"
                      >
                        <CityIcon icon="compass" className="h-3.5 w-3.5" />
                        Get Directions
                      </a>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="max-h-[34rem] overflow-y-auto rounded-3xl border border-white/10 bg-slate-900/70 p-3">
            <ul className="space-y-1.5">
              {visible.map((item) => {
                const style = KIND[item.kind];
                const name =
                  item.type === "facility" ? item.facility.name : item.place.name;
                const sub = item.type === "facility"
                  ? `${item.facility.plusCode ?? "name search"} · ${item.facility.neighborhood}`
                  : `${KIND[item.kind].kindLabel} · ${item.place.neighborhood}`;
                const isActive =
                  activeItem?.type === item.type &&
                  (item.type === "facility"
                    ? item.facility.id === activeItem?.id
                    : item.place.id === activeItem?.id);
                return (
                  <li key={`${item.type}-${item.id}`}>
                    <button
                      type="button"
                      aria-pressed={isActive}
                      onClick={() =>
                        setActive(
                          item.type === "facility"
                            ? { type: "facility", id: item.facility.id }
                            : { type: "place", id: item.place.id },
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition ${
                        isActive
                          ? style.ringActive
                          : "border-transparent hover:border-white/15 hover:bg-white/[0.04]"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isActive ? style.chip : "bg-white/[0.06]"
                        } ${style.iconColor}`}
                      >
                        {item.type === "facility" ? (
                          <SportIcon sport={item.facility.category} className="h-4.5 w-4.5" />
                        ) : (
                          style.icon("h-4.5 w-4.5")
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block truncate text-sm font-bold ${
                            isActive ? style.textActive : "text-white"
                          }`}
                        >
                          {name}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {sub}
                        </span>
                      </span>
                      {isActive && (
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${style.ringActive} ${style.textActive}`}
                        >
                          On map
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            {tab === "all" && <UnpositionedBlock unpositioned={unpositioned} />}

            <p className="mt-3 border-t border-white/5 pt-3 text-[11px] leading-5 text-slate-600">
              Sport pins show verified coordinates. City landmark and park pins resolve by
              name search until surveyed — always confirm locally.
            </p>
          </div>
        </div>
      </CitySection>
    </section>
  );
}
