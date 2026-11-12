"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import BookingModal from "@/src/components/BookingModal";
import FacilityRequestModal from "@/src/components/FacilityRequestModal";
import SportIcon from "@/src/components/SportIcon";
import {
  AVAILABILITY_LABELS,
  BOOKING_RULES,
  VERIFICATION_LABELS,
  pricingLabel,
} from "@/src/lib/facilities";
import { getPublicFacility } from "@/src/lib/facilityStore";
import { getApprovedReviews, submitFacilityReview } from "@/src/lib/platform";

const mapEmbedUrl = (facility) =>
  `https://maps.google.com/maps?q=${facility.latitude}%2C${facility.longitude}&z=16&output=embed`;

const categoryLabelText = {
  football: "Football",
  basketball: "Basketball",
  volleyball: "Volleyball",
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

function FacilityPhoto({ src, alt, className, width, height }) {
  if (/^https:\/\//i.test(src ?? "")) {
    // Administrator-managed HTTPS images are rendered directly so adding a
    // facility does not require widening Next.js image host permissions.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} loading="lazy" />;
  }
  return <Image src={src} alt={alt} width={width} height={height} className={className} />;
}

function FacilityDetailsContent({ facility }) {
  const [activeImage, setActiveImage] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ bookingId: "", rating: 5, comment: "" });
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");

  const bookingRules = BOOKING_RULES[facility.pricingType] ?? [];
  const activeImageSrc = facility.images[activeImage] ?? facility.images[0];
  const isFootball = facility.pricingType === "hourly";

  useEffect(() => {
    let active = true;
    getApprovedReviews(facility.id)
      .then((items) => {
        if (active) setReviews(items);
      })
      .catch(() => {
        if (active) setReviewError("Published reviews could not be loaded right now.");
      })
      .finally(() => {
        if (active) setReviewLoading(false);
      });
    return () => {
      active = false;
    };
  }, [facility.id]);

  async function handleReviewSubmit(event) {
    event.preventDefault();
    setReviewSubmitting(true);
    setReviewError("");
    setReviewNotice("");
    try {
      await submitFacilityReview({
        bookingId: reviewForm.bookingId.trim(),
        facilityId: facility.id,
        facilityName: facility.name,
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
      });
      setReviewForm({ bookingId: "", rating: 5, comment: "" });
      setReviewNotice("Thank you. Your verified-booking review is awaiting administrator moderation.");
    } catch (error) {
      setReviewError(error?.message ?? "Your review could not be submitted.");
    } finally {
      setReviewSubmitting(false);
    }
  }

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
            <FacilityPhoto
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
                    <FacilityPhoto src={image} alt={`${facility.name} photo ${index + 1}`} width={96} height={64} className="h-full w-full object-cover" />
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
              {isFootball && facility.availability === "bookable"
                ? "Book Football Field"
                : "Request Booking"}
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
              Only customers with a confirmed paid booking can submit a review. Published
              ratings below have also passed administrator moderation.
            </p>

            {reviewLoading ? (
              <p className="mt-4 text-xs text-slate-500">Loading published reviews…</p>
            ) : reviews.length === 0 ? (
              <p className="mt-4 rounded-xl border border-white/10 bg-slate-950/50 px-4 py-3 text-xs text-slate-500">
                No approved customer reviews yet.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-xl border border-white/10 bg-slate-950/50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{review.customerName}</p>
                        <p className="mt-1 text-xs tracking-wider text-amber-300" aria-label={`${review.rating} out of 5 stars`}>
                          {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                        </p>
                      </div>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-emerald-200">
                        Verified booking
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{review.comment}</p>
                  </article>
                ))}
              </div>
            )}

            <form onSubmit={handleReviewSubmit} className="mt-5 space-y-3 border-t border-white/10 pt-5">
              <p className="text-sm font-bold text-white">Review your visit</p>
              <label className="block text-xs font-semibold text-slate-300">
                Confirmed booking reference
                <input
                  required
                  minLength={8}
                  value={reviewForm.bookingId}
                  onChange={(event) => setReviewForm((current) => ({ ...current, bookingId: event.target.value }))}
                  placeholder="Your booking reference"
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-emerald-400/50"
                />
              </label>
              <label className="block text-xs font-semibold text-slate-300">
                Rating
                <select
                  value={reviewForm.rating}
                  onChange={(event) => setReviewForm((current) => ({ ...current, rating: Number(event.target.value) }))}
                  className="mt-2 min-h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm text-white outline-none focus:border-emerald-400/50"
                >
                  <option value={5}>5 — Excellent</option>
                  <option value={4}>4 — Good</option>
                  <option value={3}>3 — Average</option>
                  <option value={2}>2 — Below average</option>
                  <option value={1}>1 — Poor</option>
                </select>
              </label>
              <label className="block text-xs font-semibold text-slate-300">
                Review
                <textarea
                  required
                  minLength={10}
                  maxLength={1500}
                  rows={4}
                  value={reviewForm.comment}
                  onChange={(event) => setReviewForm((current) => ({ ...current, comment: event.target.value }))}
                  placeholder="Share specific, respectful feedback about your visit."
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
                />
              </label>
              {reviewError && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs text-red-200">{reviewError}</p>}
              {reviewNotice && <p role="status" className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-200">{reviewNotice}</p>}
              <button type="submit" disabled={reviewSubmitting} className="min-h-11 w-full rounded-xl border border-emerald-400/30 bg-emerald-400/10 text-xs font-bold text-emerald-200 hover:bg-emerald-400/15 disabled:opacity-50">
                {reviewSubmitting ? "Verifying booking…" : "Submit review for moderation"}
              </button>
            </form>
          </section>
        </div>
      </div>

      {bookingOpen &&
        (isFootball && facility.availability === "bookable" ? (
          <BookingModal field={facility} onClose={() => setBookingOpen(false)} />
        ) : (
          <FacilityRequestModal facility={facility} onClose={() => setBookingOpen(false)} />
        ))}
    </div>
  );
}

export default function FacilityDetailsView({ facilityId, initialFacility }) {
  const [facility, setFacility] = useState(initialFacility);
  const [loading, setLoading] = useState(!initialFacility);

  useEffect(() => {
    let active = true;
    getPublicFacility(facilityId)
      .then((record) => {
        if (active) setFacility(record);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [facilityId]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-slate-400">Loading facility details…</div>;
  }
  if (!facility) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md rounded-2xl border border-white/10 bg-slate-900 p-8 text-center">
          <h1 className="text-xl font-bold text-white">Facility not available</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">This listing does not exist or is not currently published.</p>
          <Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-emerald-500 px-5 text-sm font-bold text-slate-950">Browse facilities</Link>
        </div>
      </div>
    );
  }
  return <FacilityDetailsContent facility={facility} />;
}
