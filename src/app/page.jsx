"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import BookingModal from "@/src/components/BookingModal";
import FacilityRequestModal from "@/src/components/FacilityRequestModal";
import SportIcon from "@/src/components/SportIcon";
import CityHero from "@/src/components/CityHero";
import CitySection from "@/src/components/CitySection";
import CityPlaceCard from "@/src/components/CityPlaceCard";
import CityDiscover from "@/src/components/CityDiscover";
import CityCulture from "@/src/components/CityCulture";
import CityMap from "@/src/components/CityMap";
import { CITY_LANDMARKS, CITY_MARKETS, CITY_PARKS } from "@/src/lib/city";
import {
  SPORT_CATEGORIES,
  matchesCategory,
} from "@/src/lib/categories";
import {
  facilities,
  AVAILABILITY_LABELS,
  pricingLabel,
} from "@/src/lib/facilities";

function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

const TIME_FILTERS = [
  { value: "all", label: "Any time" },
  { value: "morning", label: "Morning (before 12:00)" },
  { value: "afternoon", label: "Afternoon (12:00–17:00)" },
  { value: "evening", label: "Evening (after 17:00)" },
];

const SORT_OPTIONS = [
  { value: "featured", label: "Featured order" },
  { value: "price-asc", label: "Price: lowest first" },
  { value: "price-desc", label: "Price: highest first" },
  { value: "rating", label: "Highest rated" },
  { value: "distance", label: "Nearest to me" },
];

const PRICE_FILTERS = [
  { value: "any", label: "Any price" },
  { value: "listed", label: "Has listed price" },
  { value: "contact", label: "Contact for price" },
];

const AVAILABILITY_FILTERS = [
  { value: "any", label: "Any availability" },
  { value: "bookable", label: "Bookable now" },
  { value: "contact", label: "Contact for availability" },
];

function priceForSort(facility) {
  if (facility.pricingType === "hourly") return facility.hourlyPrice;
  if (facility.pricingType === "per_person") return facility.perPersonPrice;
  if (facility.pricingType === "per_session") return facility.sessionPrice;
  const pricedPlan = facility.membershipPlans.find((plan) => plan.price !== null);
  return pricedPlan ? pricedPlan.price : null;
}

function slotMatchesTimeFilter(slot, timeFilter) {
  if (timeFilter === "morning") return slot < "12:00";
  if (timeFilter === "afternoon") return slot >= "12:00" && slot < "17:00";
  if (timeFilter === "evening") return slot >= "17:00";
  return true;
}

function facilityMatchesTime(facility, timeFilter) {
  if (timeFilter === "all") return true;
  const slots = facility.availableTimeSlots;
  if (slots.length > 0) {
    return slots.some((slot) => slotMatchesTimeFilter(slot, timeFilter));
  }
  return false;
}

function categoryLabel(key) {
  return SPORT_CATEGORIES.find((category) => category.key === key)?.label ?? key;
}

function activitiesLabel(facility) {
  return facility.activities.map((key) => categoryLabel(key)).join(" · ");
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
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

function LogoIcon({ className = "h-6 w-6" }) {
  return <SportIcon sport="football" className={className} />;
}

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

function MapIcon({ className = "h-4 w-4" }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Zm0 0v14m6-12v14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4.5 w-4.5">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M10 1.5 12.6 7l6 .6-4.5 4 1.3 5.9-5.4-3-5.4 3L5.9 11.6l-4.5-4 6-.6L10 1.5Z" />
    </svg>
  );
}

function FacilityCard({ facility, distanceKm, onBook }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 transition duration-200 hover:-translate-y-1 hover:border-emerald-400/30 hover:shadow-[0_20px_55px_rgba(0,0,0,0.35)]">
      <div className="relative h-44 overflow-hidden">
        <Image
          src={facility.images[0]}
          alt={`${facility.name} — ${categoryLabel(facility.category)} facility in Dire Dawa`}
          width={640}
          height={352}
          loading="lazy"
          className="h-44 w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur">
            <PinIcon className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
            {facility.neighborhood}
          </span>
          {distanceKm !== null && distanceKm !== undefined && (
            <span className="rounded-full border border-white/15 bg-slate-950/70 px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur">
              {distanceKm < 10
                ? `${distanceKm.toFixed(1)} km`
                : `${Math.round(distanceKm)} km`}
            </span>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400 px-3 py-1.5 text-xs font-bold text-slate-950">
            <SportIcon sport={facility.category} className="h-3.5 w-3.5" />
            {facility.pricingType === "hourly" ? "Book now" : "Request access"}
          </span>
          {facility.rating !== null && (
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-slate-950/80 px-2.5 py-1.5 text-xs font-bold text-amber-300 backdrop-blur">
              <StarIcon />
              {facility.rating.toFixed(1)}
            </span>
          )}
        </div>
        {facility.googleMapsUrl && (
          <a
            href={facility.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${facility.name} on Google Maps`}
            title="View on Google Maps"
            className="absolute right-3 bottom-14 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-slate-950/75 text-slate-200 backdrop-blur transition hover:border-emerald-400/60 hover:bg-emerald-500/20 hover:text-emerald-300"
          >
            <MapIcon />
          </a>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-emerald-300">
            <SportIcon sport={facility.category} className="h-3.5 w-3.5" />
            {categoryLabel(facility.category)}
          </span>
          <span
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${
              facility.availability === "bookable"
                ? "bg-white/[0.07] text-white"
                : "bg-white/[0.05] text-slate-400"
            }`}
          >
            {AVAILABILITY_LABELS[facility.availability]}
          </span>
        </div>

        <h3 className="mt-3 text-lg font-bold leading-snug tracking-tight text-white">
          {facility.name}
        </h3>
        {facility.activities.length > 1 && (
          <p className="mt-1 text-xs text-slate-500">{activitiesLabel(facility)}</p>
        )}
        {facility.notes && (
          <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{facility.notes}</p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-3.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            Pricing
          </span>
          <span className="text-right text-sm font-extrabold text-emerald-400">
            {pricingLabel(facility)}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/facilities/${facility.id}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2.5 text-xs font-bold text-white transition hover:border-emerald-400/50 hover:bg-white/[0.08] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
          >
            View Details
          </Link>
          <button
            type="button"
            onClick={() => onBook(facility)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/[0.06] px-3 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500 hover:text-slate-950 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
          >
            Book Now <ArrowIcon />
          </button>
        </div>
      </div>
    </article>
  );
}

function CategoryNav({ activeCategory, onSelect, counts }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {SPORT_CATEGORIES.map((category) => {
        const isActive = activeCategory === category.key;
        const count = counts[category.key] ?? 0;
        return (
          <button
            key={category.key}
            type="button"
            aria-pressed={isActive}
            onClick={() => onSelect(category.key)}
            className={`flex min-h-[5.5rem] flex-col items-start justify-between gap-2 rounded-2xl border p-4 text-left transition${
              isActive
                ? " border-emerald-400/60 bg-emerald-500/10 shadow-[0_12px_35px_rgba(16,185,129,0.12)]"
                : " border-white/10 bg-slate-900 hover:-translate-y-0.5 hover:border-emerald-400/30 hover:bg-white/[0.05]"
            }`}
          >
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                isActive ? "bg-emerald-400 text-slate-950" : "bg-white/[0.06] text-emerald-400"
              }`}
            >
              <SportIcon sport={category.key} className="h-5 w-5" />
            </span>
            <span>
              <span
                className={`block text-sm font-bold ${
                  isActive ? "text-emerald-300" : "text-white"
                }`}
              >
                {category.label}
              </span>
              <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">
                {count} {count === 1 ? "facility" : "facilities"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FilterBar({
  query,
  onQueryChange,
  categoryFilter,
  onCategoryChange,
  neighborhoodOptions,
  neighborhoodFilter,
  onNeighborhoodChange,
  priceFilter,
  onPriceChange,
  availabilityFilter,
  onAvailabilityChange,
  timeFilter,
  onTimeChange,
  sortBy,
  onSortChange,
  hasActiveFilters,
  onClearFilters,
  onNearMe,
  visibleCount,
}) {
  const selectBase =
    "min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-medium text-white outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15";
  const label = "block text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500";

  return (
    <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/70 p-4 sm:p-5 lg:flex-row lg:items-end">
      <label className={`${label} flex-1 lg:min-w-56`}>
        Search facilities
        <span className="relative mt-1.5 block">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          >
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Name, sport, or neighborhood…"
            aria-label="Search facilities by name, sport, or neighborhood"
            className={`${selectBase} pl-9`}
          />
        </span>
      </label>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex lg:items-end">
        <label className={label}>
          Category
          <select
            value={categoryFilter}
            onChange={(event) => onCategoryChange(event.target.value)}
            aria-label="Filter by sports category"
            className={`mt-1.5 ${selectBase} lg:w-40`}
          >
            {SPORT_CATEGORIES.map((category) => (
              <option key={category.key} value={category.key}>
                {category.label}
              </option>
            ))}
          </select>
        </label>

        <label className={label}>
          Location
          <select
            value={neighborhoodFilter}
            onChange={(event) => onNeighborhoodChange(event.target.value)}
            aria-label="Filter by location"
            className={`mt-1.5 ${selectBase} lg:w-44`}
          >
            <option value="all">All locations</option>
            {neighborhoodOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className={label}>
          Price
          <select
            value={priceFilter}
            onChange={(event) => onPriceChange(event.target.value)}
            aria-label="Filter by price"
            className={`mt-1.5 ${selectBase} lg:w-40`}
          >
            {PRICE_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={label}>
          Availability
          <select
            value={availabilityFilter}
            onChange={(event) => onAvailabilityChange(event.target.value)}
            aria-label="Filter by availability"
            className={`mt-1.5 ${selectBase} lg:w-44`}
          >
            {AVAILABILITY_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={label}>
          Time
          <select
            value={timeFilter}
            onChange={(event) => onTimeChange(event.target.value)}
            aria-label="Filter by booking time"
            className={`mt-1.5 ${selectBase} lg:w-44`}
          >
            {TIME_FILTERS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={label}>
          Sort by
          <select
            value={sortBy}
            onChange={(event) => onSortChange(event.target.value)}
            aria-label="Sort facilities"
            className={`mt-1.5 ${selectBase} lg:w-44`}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-2 lg:flex lg:flex-row">
        <button
          type="button"
          onClick={onNearMe}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 text-xs font-bold text-white transition hover:border-emerald-400/50 hover:bg-white/[0.08] focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
        >
          <PinIcon className="h-4 w-4 text-emerald-400" />
          Near me
        </button>
        <button
          type="button"
          onClick={onClearFilters}
          disabled={!hasActiveFilters}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-transparent px-4 text-xs font-bold text-slate-300 transition hover:border-white/30 hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear filters
        </button>
      </div>

      <p className="text-xs font-semibold text-slate-500 lg:ml-auto lg:whitespace-nowrap">
        {visibleCount} of {facilities.length} facilities shown
      </p>
    </div>
  );
}


export default function HomePage() {
  const [bookingFacility, setBookingFacility] = useState(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [neighborhoodFilter, setNeighborhoodFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("any");
  const [availabilityFilter, setAvailabilityFilter] = useState("any");
  const [timeFilter, setTimeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("featured");
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState("");

  const neighborhoodOptions = useMemo(
    () =>
      [...new Set(facilities.map((facility) => facility.neighborhood))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [],
  );

  const categoryCounts = useMemo(() => {
    const counts = { all: facilities.length };
    for (const category of SPORT_CATEGORIES) {
      if (category.key === "all") continue;
      counts[category.key] = facilities.filter((facility) =>
        matchesCategory(facility, category.key),
      ).length;
    }
    return counts;
  }, []);

  const filteredFacilities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const priceValue = (facility) => priceForSort(facility);
    return facilities.filter((facility) => {
      const haystack = [
        facility.name,
        facility.neighborhood,
        facility.plusCode ?? "",
        ...facility.activities,
      ]
        .join(" ")
        .toLowerCase();
      if (normalizedQuery && !haystack.includes(normalizedQuery)) return false;
      if (!matchesCategory(facility, categoryFilter)) return false;
      if (neighborhoodFilter !== "all" && facility.neighborhood !== neighborhoodFilter) {
        return false;
      }
      if (priceFilter === "listed" && priceValue(facility) === null) return false;
      if (priceFilter === "contact" && priceValue(facility) !== null) return false;
      if (
        availabilityFilter !== "any" &&
        facility.availability !== availabilityFilter
      ) {
        return false;
      }
      if (timeFilter !== "all" && !facilityMatchesTime(facility, timeFilter)) return false;
      return true;
    });
  }, [
    query,
    categoryFilter,
    neighborhoodFilter,
    priceFilter,
    availabilityFilter,
    timeFilter,
  ]);

  const distanceMap = useMemo(() => {
    if (!userLocation) return null;
    return new Map(
      facilities.map((facility) => [
        facility.id,
        facility.latitude !== null && facility.longitude !== null
          ? haversineKm(
              userLocation.latitude,
              userLocation.longitude,
              facility.latitude,
              facility.longitude,
            )
          : null,
      ]),
    );
  }, [userLocation]);

  const visibleFacilities = useMemo(() => {
    const list = [...filteredFacilities];
    const priceOf = (facility) => priceForSort(facility);
    if (sortBy === "price-asc" || sortBy === "price-desc") {
      const priced = list
        .filter((facility) => priceOf(facility) !== null)
        .sort((a, b) =>
          sortBy === "price-asc"
            ? priceOf(a) - priceOf(b)
            : priceOf(b) - priceOf(a),
        );
      const unpriced = list.filter((facility) => priceOf(facility) === null);
      return [...priced, ...unpriced];
    }
    if (sortBy === "rating") {
      return list.sort(
        (a, b) => (b.rating ?? -1e9) - (a.rating ?? -1e9),
      );
    }
    if (sortBy === "distance" && distanceMap) {
      return list.sort(
        (a, b) =>
          (distanceMap.get(a.id) ?? Infinity) -
          (distanceMap.get(b.id) ?? Infinity),
      );
    }
    return list;
  }, [filteredFacilities, sortBy, distanceMap]);

  const hasActiveFilters =
    query.trim() !== "" ||
    categoryFilter !== "all" ||
    neighborhoodFilter !== "all" ||
    priceFilter !== "any" ||
    availabilityFilter !== "any" ||
    timeFilter !== "all" ||
    sortBy !== "featured" ||
    userLocation !== null;

  function clearFilters() {
    setQuery("");
    setCategoryFilter("all");
    setNeighborhoodFilter("all");
    setPriceFilter("any");
    setAvailabilityFilter("any");
    setTimeFilter("all");
    setSortBy("featured");
    setUserLocation(null);
    setLocationError("");
  }

  function handleCategorySelect(key) {
    setCategoryFilter(key);
    window.setTimeout(() => {
      document.querySelector("#facilities")?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }

  function handleNearMe() {
    setLocationError("");
    if (!("geolocation" in navigator)) {
      setLocationError("Your browser does not support location services.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setSortBy("distance");
      },
      () => {
        setLocationError(
          "We couldn’t read your location. Allow location access, then try again.",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }

  function handleSortChange(value) {
    setSortBy(value);
    if (value === "distance" && !userLocation) {
      handleNearMe();
    }
  }

  function openBooking(facility) {
    setBookingFacility(facility);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="#" className="flex items-center gap-3" aria-label="Dire Sport Fields home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
              <LogoIcon />
            </span>
            <span className="text-base font-extrabold tracking-tight text-white sm:text-lg">
              Dire Sport <span className="text-emerald-400">Fields</span>
            </span>
          </Link>
          <nav aria-label="Main navigation" className="flex items-center gap-3">
            <a
              href="#discover"
              className="hidden px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:inline-flex"
            >
              Discover
            </a>
            <a
              href="#markets"
              className="hidden px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white md:inline-flex"
            >
              Markets
            </a>
            <a
              href="#map"
              className="hidden px-3 py-2 text-sm font-medium text-slate-300 transition hover:text-white sm:inline-flex"
            >
              Map view
            </a>
            <a
              href="#facilities"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-emerald-400/60 hover:bg-white/5"
            >
              Browse facilities
            </a>
          </nav>
        </div>
      </header>
      <CityHero onFindNearMe={handleNearMe} />


      <section
        id="sports"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 py-14 sm:px-8 sm:py-16"
      >
        <div className="mb-8 max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
            Choose your sport
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Browse by category
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
            Tap a category to filter every facility on the platform.
          </p>
        </div>
        <CategoryNav
          activeCategory={categoryFilter}
          onSelect={handleCategorySelect}
          counts={categoryCounts}
        />
      </section>

      <section
        id="facilities"
        className="mx-auto max-w-7xl scroll-mt-24 px-5 pb-16 pt-4 sm:px-8 sm:pb-20"
      >
        <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              Find your venue
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Facilities around Dire Dawa
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400 sm:text-base">
              Compare courts, pitches, gyms, and pools, then book a slot or request access.
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-400">
            {facilities.length} facilities · {SPORT_CATEGORIES.length - 1} sports
          </p>
        </div>

        <FilterBar
          query={query}
          onQueryChange={setQuery}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          neighborhoodOptions={neighborhoodOptions}
          neighborhoodFilter={neighborhoodFilter}
          onNeighborhoodChange={setNeighborhoodFilter}
          priceFilter={priceFilter}
          onPriceChange={setPriceFilter}
          availabilityFilter={availabilityFilter}
          onAvailabilityChange={setAvailabilityFilter}
          timeFilter={timeFilter}
          onTimeChange={setTimeFilter}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
          onNearMe={handleNearMe}
          visibleCount={visibleFacilities.length}
        />

        {locationError && (
          <p
            role="alert"
            className="mb-6 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200"
          >
            {locationError}
          </p>
        )}

        {visibleFacilities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleFacilities.map((facility) => (
              <FacilityCard
                key={facility.id}
                facility={facility}
                distanceKm={distanceMap?.get(facility.id) ?? null}
                onBook={openBooking}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-slate-900 p-10 text-center">
            <p className="text-lg font-bold text-white">
              No {categoryFilter === "all" ? "" : `${categoryLabel(categoryFilter)} `}facilities
              match your search
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
              Try a different keyword, category, or location — or clear the filters to see all
              listed venues.
            </p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-500 px-5 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-400"
            >
              Clear filters
            </button>
          </div>
        )}

        <p className="mt-6 text-xs leading-5 text-slate-500">
          Facility names, map pins, surfaces, and prices come from public map listings and marked
          when they still need confirmation — always double-check with the venue before you go.
        </p>
      </section>

      <CityDiscover />

      <CitySection
        id="landmarks"
        tone="dark"
        eyebrow="Famous landmarks"
        title="Famous places, mapped and explained"
        subtitle="From the station that started it all to the cave where Stone Age tools were found — these are the places Dire Dawa is known for. Each card links straight to a Google Maps search so you can head out today."
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {CITY_LANDMARKS.map((place) => (
            <CityPlaceCard key={place.id} place={place} tone="dark" />
          ))}
        </div>
      </CitySection>

      <div className="border-y border-stone-200">
        <CitySection
          id="markets"
          tone="light"
          eyebrow="Markets & shopping"
          title="Do your shopping the Dire way"
          subtitle="Markets are the city's living rooms. Whether you need spices for dinner, a second phone or just an hour of people-watching, these are the quarters where it happens. Prices and hours are rarely posted — ask, and enjoy the bargaining."
        >
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {CITY_MARKETS.map((place) => (
              <CityPlaceCard key={place.id} place={place} tone="light" />
            ))}
          </div>
          <p className="mt-6 text-xs leading-5 text-stone-500">
            Markets evolve daily. Opening hours and stall locations change with the
            season — treat these listings as starting points for your own exploring.
          </p>
        </CitySection>
      </div>

      <CitySection
        id="parks"
        tone="dark"
        eyebrow="Parks & recreation"
        title="Green corners of Dire Dawa"
        subtitle="Along the Dechatu valley and in the neighbourhoods, the city keeps its patches of shade: gardens, play areas and recreation centres for slow evenings."
      >
        <div className="relative mb-8 overflow-hidden rounded-3xl border border-white/10">
          <Image
            src="/images/city/hero-aerial.jpg"
            alt="Aerial view over the Dechatu river valley in Dire Dawa"
            width={1280}
            height={560}
            loading="lazy"
            sizes="(min-width: 1280px) 80rem, 100vw"
            className="h-64 w-full object-cover sm:h-72"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/25 to-slate-950/60"
          />
          <div className="absolute inset-y-0 left-0 flex max-w-md flex-col justify-center p-6 sm:p-8">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-lime-300">
              The Dechatu valley
            </p>
            <p className="mt-2 text-lg font-bold text-white font-display sm:text-xl">
              The riverbed shapes where the city breathes
            </p>
            <p className="mt-1.5 text-sm leading-6 text-slate-300">
              Green spaces follow the seasonal river, which splits the city into Kezira,
              Megala and the Sabian side.
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {CITY_PARKS.map((place) => (
            <CityPlaceCard key={place.id} place={place} tone="dark" />
          ))}
        </div>
      </CitySection>

      <CityCulture />

      <CityMap onBook={openBooking} />

      <section id="how-it-works" className="scroll-mt-24 border-b border-white/5">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">
              Why choose us
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Why choose Dire Sport Fields
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400 sm:text-base">
              One platform for playing and exploring Dire Dawa — built on verified
              local listings, not guesswork.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                number: "01",
                title: "Everything in one place",
                description:
                  "Every mapped pitch, court, gym, and recreational venue around Dire Dawa, searchable by sport, price and distance in seconds.",
              },
              {
                number: "02",
                title: "Book the real way",
                description:
                  "Football pitches take instant hourly bookings; courts, gyms, and pools send booking requests the venue confirms by phone.",
              },
              {
                number: "03",
                title: "Built for Dire Dawa",
                description:
                  "Football groups can split the cost in ETB, prices are marked where confirmed, and city landmarks and markets are only a tab away.",
              },
            ].map((step) => (
              <article
                key={step.number}
                className="rounded-2xl border border-white/10 bg-slate-900 p-6 sm:p-7"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/10 text-sm font-extrabold text-emerald-400">
                  {step.number}
                </span>
                <h3 className="mt-5 text-lg font-bold text-white">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-slate-950">
                  <LogoIcon />
                </span>
                <span className="text-base font-extrabold tracking-tight text-white">
                  Dire Sport <span className="text-emerald-400">Fields</span>
                </span>
              </span>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Find a venue. Discover the city. Bring your team and play in Dire Dawa.
              </p>
            </div>
            <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-12 gap-y-2 text-sm">
              <a href="#sports" className="text-slate-400 transition hover:text-emerald-300">
                Sports
              </a>
              <a href="#facilities" className="text-slate-400 transition hover:text-emerald-300">
                Facilities
              </a>
              <a href="#discover" className="text-slate-400 transition hover:text-amber-300">
                Discover
              </a>
              <a href="#landmarks" className="text-slate-400 transition hover:text-amber-300">
                Landmarks
              </a>
              <a href="#markets" className="text-slate-400 transition hover:text-amber-300">
                Markets
              </a>
              <a href="#parks" className="text-slate-400 transition hover:text-lime-300">
                Parks
              </a>
              <a href="#culture" className="text-slate-400 transition hover:text-amber-300">
                Culture
              </a>
              <a href="#map" className="text-slate-400 transition hover:text-emerald-300">
                Map view
              </a>
            </nav>
          </div>
          <p className="mt-8 border-t border-white/5 pt-5 text-xs leading-5 text-slate-600">
            City photographs: Wikimedia Commons contributors, CC BY / CC BY-SA. Locations
            for landmarks and parks resolve by name search — confirm details locally.
          </p>
        </div>
      </footer>

      {bookingFacility && bookingFacility.pricingType === "hourly" && (
        <BookingModal facility={bookingFacility} onClose={() => setBookingFacility(null)} />
      )}
      {bookingFacility && bookingFacility.pricingType !== "hourly" && (
        <FacilityRequestModal
          facility={bookingFacility}
          onClose={() => setBookingFacility(null)}
        />
      )}
    </main>
  );
}
