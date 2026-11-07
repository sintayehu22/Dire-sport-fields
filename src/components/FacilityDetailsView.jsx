"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import BookingModal from "@/src/components/BookingModal";
import FacilityRequestModal from "@/src/components/FacilityRequestModal";
import SportIcon from "@/src/components/SportIcon";
import {
  AVAILABILITY_LABELS,
  BOOKING_RULES,
  VERIFICATION_LABELS,
  pricingLabel,
} from "@/src/lib/facilities";

const mapEmbedUrl = (facility) =>
  `https://maps.google.com/maps?q=${facility.latitude}%2C${facility.longitude}&z=16&output=embed`;

const categoryLabelText = {
  football: "Football",
  basketball: "Basketball",
  volleyball: "Volleyball",
  tennis: "Tennis",
  badminton: "Badminton",
  swimming: "Swimming",
  gym: "Gym & Fitness",
  handball: "Handball",
  recreation: "Other Recreation",
};

function categoryLabel(key) {
  return categoryLabelText[key] ?? key;
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 py-3 last:border-b-0">
      <span className="shrink-0 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </span>
      <span className="text-right text-sm text-slate-200">{value}</span>
    </div>
  );
}

export default function FacilityDetailsView({ facility }) {
  const [activeImage, setActiveImage] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);

  const bookingRules = BOOKING_RULES[facility.pricingType] ?? [];
  const activeImageSrc = facility.images[activeImage] ?? facility.images[0];
  const isFootball = facility.pricingType === "hourly";

  return (
    <div className="mx-auto max-w-7xl px-5 pb-16 pt-6 sm:px-8 sm:pb-20">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 transition hover:text-white focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <path
            d="M16 10H4m5-5-5 5 5 5"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back to all facilities
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.1em] text-emerald-300">
              <SportIcon sport={facility.category} className="h-3.5 w-3.5" />
              {categoryLabel(facility.category)}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-300">
              {VERIFICATION_LABELS[facility.verificationStatus]}
            </span>
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                facility.availability === "bookable"
                  ? "bg-emerald-400/15 text-emerald-300"
                  : "bg-amber-400/10 text-amber-300"
              }`}
            >
              {AVAILABILITY_LABELS[facility.availability]}
            </span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {facility.name}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-emerald-400">
              <path
                d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            {facility.neighborhood}, Dire Dawa
            {facility.plusCode ? ` · Plus code ${facility.plusCode}` : ""}
          </p>
        </div>

        {facility.rating !== null && (
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 text-amber-300" fill="currentColor">
              <path d="M10 1.5 12.6 7l6 .6-4.5 4 1.3 5.9-5.4-3-5.4 3L5.9 11.6l-4.5-4 6-.6L10 1.5Z" />
            </svg>
            <span className="text-lg font-extrabold text-white">
              {facility.rating.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500">venue rating</span>
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
            <Image
              src={activeImageSrc}
              alt={`Photo of ${facility.name} in Dire Dawa`}
              width={1536}
              height={768}
              className="h-72 w-full object-cover sm:h-96"
            />
            {facility.images.length > 1 && (
              <div className="flex gap-2 p-3">
                {facility.images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-pressed={index === activeImage}
                    className={`h-16 w-24 overflow-hidden rounded-xl border transition ${
                      index === activeImage
                        ? "border-emerald-400"
                        : "border-white/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image src={image} alt={`${facility.name} photo ${index + 1}`} width={96} height={64} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <section className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-lg font-bold text-white">About this venue</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{facility.description}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Activities
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {facility.activities.map((sport) => (
                    <span
                      key={sport}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-slate-200"
                    >
                      <SportIcon sport={sport} className="h-3.5 w-3.5 text-emerald-400" />
                      {categoryLabel(sport)}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Amenities
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {facility.amenities.length > 0
                    ? facility.amenities.join(", ")
                    : "To be confirmed with the venue"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-lg font-bold text-white">Facility information</h2>
            <div className="mt-3">
              <InfoRow
                label="Pricing"
                value={<span className="font-bold text-emerald-400">{pricingLabel(facility)}</span>}
              />
              <InfoRow
                label="Opening hours"
                value={facility.openingHours ?? "To be confirmed with the venue"}
              />
              <InfoRow
                label="Capacity"
                value={
                  facility.capacity !== null
                    ? `${facility.capacity} people`
                    : "To be confirmed with the venue"
                }
              />
              <InfoRow
                label="Phone"
                value={
                  facility.phone ?? "Not published yet — find contact details on the venue’s map listing"
                }
              />
              <InfoRow
                label="Availability"
                value={AVAILABILITY_LABELS[facility.availability]}
              />
              <InfoRow
                label="Listing status"
                value={VERIFICATION_LABELS[facility.verificationStatus]}
              />
            </div>
            {facility.notes && (
              <p className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-xs leading-5 text-amber-200">
                {facility.notes}
              </p>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-lg font-bold text-white">Booking rules</h2>
            <ul className="mt-3 space-y-2.5">
              {bookingRules.map((rule) => (
                <li key={rule} className="flex items-start gap-3 text-sm text-slate-300">
                  <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                  {rule}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-lg font-bold text-white">Pricing</h2>
            <p className="mt-2 text-sm text-slate-400">
              {isFootball
                ? "Hourly pitch rental — total price = hourly price × duration once the owner confirms."
                : facility.pricingType === "membership"
                  ? "Memberships are confirmed at the venue. Plans below show the requested package."
                  : facility.pricingType === "per_person"
                    ? "Entry is calculated per visitor or session once the venue confirms."
                    : "Pricing is agreed directly with the venue."}
            </p>
            {facility.pricingType === "membership" && facility.membershipPlans.length > 0 && (
              <ul className="mt-4 space-y-2">
                {facility.membershipPlans.map((plan) => (
                  <li
                    key={plan.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm"
                  >
                    <span className="font-semibold text-slate-200">{plan.label}</span>
                    <span className="font-bold text-emerald-400">
                      {plan.price !== null ? `${plan.price.toLocaleString("en-US")} ETB` : "Contact for price"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-extrabold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/30"
            >
              {isFootball ? "Book Football Field" : "Request Booking"}
            </button>
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/10 bg-slate-900">
            {facility.latitude !== null && facility.longitude !== null ? (
              <iframe
                title={`Google map showing ${facility.name} in Dire Dawa`}
                src={mapEmbedUrl(facility)}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                className="h-64 w-full border-0"
              />
            ) : (
              <div className="flex h-40 items-center justify-center bg-slate-950/60 text-sm text-slate-500">
                No verified map pin for this venue yet
              </div>
            )}
            {facility.googleMapsUrl && (
              <a
                href={facility.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-12 items-center justify-center gap-2 border-t border-white/10 text-sm font-bold text-emerald-400 transition hover:bg-white/[0.04]"
              >
                View on Google Maps
                <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                  <path
                    d="M6 6h8v8M14 6 6 14"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-lg font-bold text-white">Ratings &amp; reviews</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Customer reviews are coming soon. Verified ratings collected from players and
              members will appear here once the venue confirms its listing.
            </p>
          </section>
        </div>
      </div>

      {bookingOpen &&
        (isFootball ? (
          <BookingModal field={facility} onClose={() => setBookingOpen(false)} />
        ) : (
          <FacilityRequestModal facility={facility} onClose={() => setBookingOpen(false)} />
        ))}
    </div>
  );
}
