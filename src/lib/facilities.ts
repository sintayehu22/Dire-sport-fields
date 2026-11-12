/**
 * Multi-sport facility data for Dire Dawa, Ethiopia.
 *
 * Data policy:
 *  - Coordinates/Plus Codes come from mapped Google listings (decoded with the
 *    official Open Location Code library). Facilities without a verified pin keep
 *    null coordinates so nothing is guessed.
 *  - Prices, capacities, opening hours, phones, ratings and amenities are null
 *    until confirmed from a real source. Nothing is invented.
 *  - Football pitches are derived from the existing, unchanged `fields.ts` data so
 *    the running football booking flow keeps working as-is.
 */

import { fields } from "./fields";
import type { SportKey } from "./categories";

export type PricingType = "hourly" | "per_person" | "per_session" | "membership" | "contact";

export type AvailabilityStatus = "bookable" | "contact" | "unavailable";

export type VerificationStatus = "verified" | "reported" | "unverified";

export type MembershipPlan = {
  id: string;
  label: string;
  price: number | null;
};

export type Facility = {
  id: string;
  name: string;
  category: SportKey;
  activities: SportKey[];
  description: string;
  neighborhood: string;
  latitude: number | null;
  longitude: number | null;
  plusCode: string | null;
  googleMapsUrl: string | null;
  images: string[];
  rating: number | null;
  pricingType: PricingType;
  hourlyPrice: number | null;
  perPersonPrice: number | null;
  sessionPrice: number | null;
  membershipPlans: MembershipPlan[];
  capacity: number | null;
  openingHours: string | null;
  phone: string | null;
  amenities: string[];
  availability: AvailabilityStatus;
  verificationStatus: VerificationStatus;
  notes: string;
  availableTimeSlots: string[];
};

export const FACILITY_IMAGE_PLACEHOLDERS = {
  field: "/images/fields/field-placeholder.svg",
  hall: "/images/facilities/hall-placeholder.svg",
};

const mapsPinFor = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`;

/* ------------------------------------------------------------------ */
/* Football pitches (derived from the existing verified fields data)   */
/* ------------------------------------------------------------------ */

const footballFacilities: Facility[] = fields.map((field) => ({
  id: field.id,
  name: field.name,
  category: "football",
  activities: ["football"],
  description: field.notes,
  neighborhood: field.neighborhood,
  latitude: field.latitude,
  longitude: field.longitude,
  plusCode: field.plusCode,
  googleMapsUrl: field.googleMapsUrl,
  images: [field.imageUrl],
  rating: null,
  pricingType: "hourly",
  hourlyPrice: field.hourlyPrice,
  perPersonPrice: null,
  sessionPrice: null,
  membershipPlans: [],
  capacity: field.capacity,
  openingHours: null,
  phone: null,
  amenities: [],
  availability: field.hourlyPrice !== null ? "bookable" : "contact",
  verificationStatus: field.googleMapsUrl ? "verified" : "reported",
  notes: field.notes,
  availableTimeSlots: field.availableTimeSlots,
}));

/* ------------------------------------------------------------------ */
/* Racquet & other court sports                                        */
/* ------------------------------------------------------------------ */

const courtFacilities: Facility[] = [
  {
    id: "railway-french-basketball-court",
    name: "Railway (French) Basketball Court",
    category: "basketball",
    activities: ["basketball"],
    description:
      "Basketball court at the old railway compound in the station district, named for the historic French railway works of Dire Dawa. Court access, opening hours and any fees should be confirmed on site.",
    neighborhood: "Railway station district",
    latitude: 9.591838,
    longitude: 41.856984,
    plusCode: "6HX3HVR4+PQQ",
    googleMapsUrl: mapsPinFor(9.591838, 41.856984),
    images: [FACILITY_IMAGE_PLACEHOLDERS.hall],
    rating: null,
    pricingType: "contact",
    hourlyPrice: null,
    perPersonPrice: null,
    sessionPrice: null,
    membershipPlans: [],
    capacity: null,
    openingHours: null,
    phone: null,
    amenities: [],
    availability: "contact",
    verificationStatus: "verified",
    notes: "Mapped court listing. Public availability not yet confirmed.",
    availableTimeSlots: [],
  },
];

export const facilities: Facility[] = [
  ...footballFacilities,
  ...courtFacilities,
];

export function getFacilityById(id: string): Facility | undefined {
  return facilities.find((facility) => facility.id === id);
}

export function pricingLabel(facility: Facility): string {
  switch (facility.pricingType) {
    case "hourly":
      return facility.hourlyPrice !== null
        ? `${facility.hourlyPrice.toLocaleString("en-US")} ETB / hr`
        : "Contact for price";
    case "per_person":
      return facility.perPersonPrice !== null
        ? `${facility.perPersonPrice.toLocaleString("en-US")} ETB per person`
        : "Contact for price";
    case "per_session":
      return facility.sessionPrice !== null
        ? `${facility.sessionPrice.toLocaleString("en-US")} ETB per session`
        : "Contact for price";
    case "membership": {
      const priced = facility.membershipPlans.find((plan) => plan.price !== null);
      return priced
        ? `${priced.label}: ${priced.price?.toLocaleString("en-US")} ETB`
        : "Membership — contact for price";
    }
    default:
      return "Contact for price";
  }
}

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  bookable: "Bookable now",
  contact: "Contact for availability",
  unavailable: "Currently unavailable",
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  verified: "Map pin verified",
  reported: "Reported — verify on site",
  unverified: "Unverified listing",
};

export const BOOKING_RULES: Record<PricingType, string[]> = {
  hourly: [
    "Submitting a booking reserves the exact time window while the request is pending.",
    "The stadium office confirms or rejects pending requests.",
    "Pending bookings do not expire automatically; contact the facility if your plans change.",
    "Payment is not collected online; the facility confirms any unverified prices.",
  ],
  per_person: [
    "Entry is counted per visitor; groups book through the venue.",
    "Session times change seasonally — confirm before travelling.",
    "Facilities with a pool may restrict swimmers who are not accompanied.",
  ],
  per_session: [
    "Sessions run on the venue’s schedule; your selection is a request, not a guarantee.",
    "The venue confirms the session price before you pay.",
  ],
  membership: [
    "Memberships are sold at the facility; online requests reserve a consultation.",
    "Bring a valid ID when you visit.",
    "Trial and training-session availability depends on the operator.",
  ],
  contact: [
    "Availability is confirmed directly with the venue.",
    "The venue sets the final price and terms for the booking.",
    "Requests are sent as booking enquiries only — nothing is charged here.",
  ],
};
