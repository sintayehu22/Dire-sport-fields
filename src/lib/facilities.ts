/**
 * Multi-sport facility data for Dire Dawa, Ethiopia.
 *
 * Data policy:
 *  - Coordinates/Plus Codes come from mapped Google listings (decoded with the
 *    official Open Location Code library). Facilities without a verified pin keep
 *    null coordinates; gyms known only by name get a Google Maps *name search*
 *    link so nothing is guessed.
 *  - Prices, capacities, opening hours, phones, ratings and amenities are null
 *    until confirmed from a real source. Nothing is invented.
 *  - University facilities (Dire Dawa University) are "reported" from the official
 *    sports information and marked "Contact for availability" — campus facilities
 *    may not be open for public booking at all.
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
  fitness: "/images/facilities/fitness-placeholder.svg",
  aquatic: "/images/facilities/aquatic-placeholder.svg",
};

const mapsPinFor = (latitude: number, longitude: number) =>
  `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`;

const mapsNameSearchFor = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

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
  availability: "bookable",
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

/* ------------------------------------------------------------------ */
/* Dire Dawa University campus sports (reported, verify on site)       */
/* ------------------------------------------------------------------ */

const universityFacilities: Facility[] = [
  {
    id: "ddu-campus-basketball-court",
    name: "DDU Campus Basketball Court",
    category: "basketball",
    activities: ["basketball", "handball"],
    description:
      "The university's sports information lists basketball (and handball) among its campus sport activities. Facilities serve students and staff first — public access, hours and any fees must be confirmed with the university sport office.",
    neighborhood: "Dire Dawa University campus",
    latitude: null,
    longitude: null,
    plusCode: null,
    googleMapsUrl: null,
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
    verificationStatus: "reported",
    notes:
      "Reported from official university sports information; no dedicated map pin yet. The mapped Dire Dawa University Stadium covers the football pitch itself.",
    availableTimeSlots: [],
  },
  {
    id: "ddu-campus-handball-court",
    name: "DDU Campus Handball Court",
    category: "handball",
    activities: ["handball", "basketball"],
    description:
      "Handball is listed among the university's campus sport activities. Whether the court can be booked by individuals outside the university is not published — confirm with the university sport office.",
    neighborhood: "Dire Dawa University campus",
    latitude: null,
    longitude: null,
    plusCode: null,
    googleMapsUrl: null,
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
    verificationStatus: "reported",
    notes: "Reported from official university sports information; no dedicated map pin yet.",
    availableTimeSlots: [],
  },
  {
    id: "ddu-campus-tennis-courts",
    name: "DDU Campus Tennis Courts",
    category: "tennis",
    activities: ["tennis"],
    description:
      "Tennis is listed among the university's campus sport activities. Court condition, public access and fees are not published — confirm with the university sport office.",
    neighborhood: "Dire Dawa University campus",
    latitude: null,
    longitude: null,
    plusCode: null,
    googleMapsUrl: null,
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
    verificationStatus: "reported",
    notes: "Reported from official university sports information; no dedicated map pin yet.",
    availableTimeSlots: [],
  },
  {
    id: "ddu-athletics-track",
    name: "DDU Athletics Track",
    category: "recreation",
    activities: ["recreation"],
    description:
      "Athletics is listed among the university's campus sport activities. The campus football stadium (listed separately) hosts track activities; public access is not published.",
    neighborhood: "Dire Dawa University campus",
    latitude: null,
    longitude: null,
    plusCode: null,
    googleMapsUrl: null,
    images: [FACILITY_IMAGE_PLACEHOLDERS.field],
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
    verificationStatus: "reported",
    notes: "Reported from official university sports information; no dedicated map pin yet.",
    availableTimeSlots: [],
  },
  {
    id: "ddu-table-tennis-room",
    name: "DDU Table Tennis Room",
    category: "recreation",
    activities: ["recreation"],
    description:
      "Table tennis is listed among the university's campus sport activities — the university has also procured tennis-table equipment. Indoor access and hours are not published.",
    neighborhood: "Dire Dawa University campus",
    latitude: null,
    longitude: null,
    plusCode: null,
    googleMapsUrl: null,
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
    verificationStatus: "reported",
    notes: "Reported from official university sports information; no dedicated map pin yet.",
    availableTimeSlots: [],
  },
];

/* ------------------------------------------------------------------ */
/* Gyms & fitness                                                      */
/* ------------------------------------------------------------------ */

const gymFacilities: Facility[] = [
  {
    id: "mdr-babur-gym",
    name: "Mdr Babur Gym",
    category: "gym",
    activities: ["gym"],
    description:
      "Gym and fitness facility by the railway compound in the station district. Access, opening hours, trainers and membership prices should be confirmed with the operator.",
    neighborhood: "Railway station district",
    latitude: 9.591913,
    longitude: 41.857078,
    plusCode: "6HX3HVR4+QR8",
    googleMapsUrl: mapsPinFor(9.591913, 41.857078),
    images: [FACILITY_IMAGE_PLACEHOLDERS.fitness],
    rating: null,
    pricingType: "membership",
    hourlyPrice: null,
    perPersonPrice: null,
    sessionPrice: null,
    membershipPlans: [
      { id: "daily", label: "Daily access", price: null },
      { id: "weekly", label: "Weekly membership", price: null },
      { id: "monthly", label: "Monthly membership", price: null },
      { id: "training", label: "Training session (if offered)", price: null },
    ],
    capacity: null,
    openingHours: null,
    phone: null,
    amenities: [],
    availability: "contact",
    verificationStatus: "verified",
    notes: "Mapped gym listing, sitting right next to the Railway (French) Basketball Court.",
    availableTimeSlots: [],
  },
  {
    id: "mh-gym-fitness",
    name: "MH GYM FITNESS – Dire Dawa",
    category: "gym",
    activities: ["gym"],
    description:
      "Gym and fitness centre named MH GYM FITNESS in Dire Dawa. Location pin, opening hours and membership prices should be confirmed — the map link searches the exact listing name.",
    neighborhood: "Dire Dawa (city)",
    latitude: null,
    longitude: null,
    plusCode: null,
    googleMapsUrl: mapsNameSearchFor("MH GYM FITNESS Dire Dawa"),
    images: [FACILITY_IMAGE_PLACEHOLDERS.fitness],
    rating: null,
    pricingType: "membership",
    hourlyPrice: null,
    perPersonPrice: null,
    sessionPrice: null,
    membershipPlans: [
      { id: "daily", label: "Daily access", price: null },
      { id: "weekly", label: "Weekly membership", price: null },
      { id: "monthly", label: "Monthly membership", price: null },
      { id: "training", label: "Training session (if offered)", price: null },
    ],
    capacity: null,
    openingHours: null,
    phone: null,
    amenities: [],
    availability: "contact",
    verificationStatus: "unverified",
    notes: "Known by name listing only; no verified map pin yet.",
    availableTimeSlots: [],
  },
  {
    id: "yabs-gym-sabian",
    name: "Yabs Gym – Sabian",
    category: "gym",
    activities: ["gym"],
    description:
      "Fitness centre in the Sabian area listed as 'Yabs'. Map pin, opening hours and membership prices should be confirmed on site.",
    neighborhood: "Sabian",
    latitude: null,
    longitude: null,
    plusCode: null,
    googleMapsUrl: mapsNameSearchFor("Yabs gym Sabian Dire Dawa"),
    images: [FACILITY_IMAGE_PLACEHOLDERS.fitness],
    rating: null,
    pricingType: "membership",
    hourlyPrice: null,
    perPersonPrice: null,
    sessionPrice: null,
    membershipPlans: [
      { id: "daily", label: "Daily access", price: null },
      { id: "weekly", label: "Weekly membership", price: null },
      { id: "monthly", label: "Monthly membership", price: null },
      { id: "training", label: "Training session (if offered)", price: null },
    ],
    capacity: null,
    openingHours: null,
    phone: null,
    amenities: [],
    availability: "contact",
    verificationStatus: "unverified",
    notes: "Known by name listing only; no verified map pin yet.",
    availableTimeSlots: [],
  },
  {
    id: "qutabaa-gym",
    name: "Qutabaa Gym",
    category: "gym",
    activities: ["gym"],
    description:
      "Gym listed in central-east Dire Dawa. Access, opening hours, trainers and membership prices should be confirmed with the operator.",
    neighborhood: "Central-east Dire Dawa",
    latitude: 9.597913,
    longitude: 41.875859,
    plusCode: "6HX3HVXG+589",
    googleMapsUrl: mapsPinFor(9.597913, 41.875859),
    images: [FACILITY_IMAGE_PLACEHOLDERS.fitness],
    rating: null,
    pricingType: "membership",
    hourlyPrice: null,
    perPersonPrice: null,
    sessionPrice: null,
    membershipPlans: [
      { id: "daily", label: "Daily access", price: null },
      { id: "weekly", label: "Weekly membership", price: null },
      { id: "monthly", label: "Monthly membership", price: null },
      { id: "training", label: "Training session (if offered)", price: null },
    ],
    capacity: null,
    openingHours: null,
    phone: null,
    amenities: [],
    availability: "contact",
    verificationStatus: "verified",
    notes: "Mapped gym listing.",
    availableTimeSlots: [],
  },
  {
    id: "hamze-ariya-gym",
    name: "Hamze Ariya Gym",
    category: "gym",
    activities: ["gym"],
    description:
      "Gym listed in north-east Dire Dawa. Access, opening hours, trainers and membership prices should be confirmed with the operator.",
    neighborhood: "North-east Dire Dawa",
    latitude: 9.606088,
    longitude: 41.872953,
    plusCode: "6HX3JV4F+C5P",
    googleMapsUrl: mapsPinFor(9.606088, 41.872953),
    images: [FACILITY_IMAGE_PLACEHOLDERS.fitness],
    rating: null,
    pricingType: "membership",
    hourlyPrice: null,
    perPersonPrice: null,
    sessionPrice: null,
    membershipPlans: [
      { id: "daily", label: "Daily access", price: null },
      { id: "weekly", label: "Weekly membership", price: null },
      { id: "monthly", label: "Monthly membership", price: null },
      { id: "training", label: "Training session (if offered)", price: null },
    ],
    capacity: null,
    openingHours: null,
    phone: null,
    amenities: [],
    availability: "contact",
    verificationStatus: "verified",
    notes: "Mapped gym listing.",
    availableTimeSlots: [],
  },
  {
    id: "la-gym-fitness",
    name: "LA Gym & Fitness",
    category: "gym",
    activities: ["gym"],
    description:
      "Fitness centre listed in central Dire Dawa. Access, opening hours, trainers and membership prices should be confirmed with the operator.",
    neighborhood: "Central Dire Dawa",
    latitude: 9.604838,
    longitude: 41.853547,
    plusCode: "6HX3JV33+WCM",
    googleMapsUrl: mapsPinFor(9.604838, 41.853547),
    images: [FACILITY_IMAGE_PLACEHOLDERS.fitness],
    rating: null,
    pricingType: "membership",
    hourlyPrice: null,
    perPersonPrice: null,
    sessionPrice: null,
    membershipPlans: [
      { id: "daily", label: "Daily access", price: null },
      { id: "weekly", label: "Weekly membership", price: null },
      { id: "monthly", label: "Monthly membership", price: null },
      { id: "training", label: "Training session (if offered)", price: null },
    ],
    capacity: null,
    openingHours: null,
    phone: null,
    amenities: [],
    availability: "contact",
    verificationStatus: "verified",
    notes: "Mapped gym listing.",
    availableTimeSlots: [],
  },
];

/* ------------------------------------------------------------------ */
/* Swimming & recreation                                               */
/* ------------------------------------------------------------------ */

const recreationFacilities: Facility[] = [
  {
    id: "papa-recreation-centre",
    name: "Papa Recreation Centre",
    category: "swimming",
    activities: ["swimming", "recreation"],
    description:
      "Recreation centre listed in the Papa area on the Sabian side of Dire Dawa. Which facilities (for example swimming or indoor games) are open to visitors should be confirmed on site.",
    neighborhood: "Papa, Sabian",
    latitude: 9.603413,
    longitude: 41.832922,
    plusCode: "6HX3JR3M+957",
    googleMapsUrl: mapsPinFor(9.603413, 41.832922),
    images: [FACILITY_IMAGE_PLACEHOLDERS.aquatic],
    rating: null,
    pricingType: "per_person",
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
    notes: "Mapped recreation listing. Facilities and entry pricing to be confirmed.",
    availableTimeSlots: [],
  },
  {
    id: "samrat-hotel",
    name: "Samrat Hotel",
    category: "recreation",
    activities: ["recreation", "swimming", "gym"],
    description:
      "Hotel south of the city centre, mapped as Samrat Hotel. Hotels in Dire Dawa commonly offer leisure facilities for guests; which facilities (pool, gym or hall) are open to outside visitors must be confirmed with the hotel.",
    neighborhood: "South Dire Dawa",
    latitude: 9.588812,
    longitude: 41.857641,
    plusCode: "6HX3HVQ5+G3C",
    googleMapsUrl: mapsPinFor(9.588812, 41.857641),
    images: [FACILITY_IMAGE_PLACEHOLDERS.aquatic],
    rating: null,
    pricingType: "contact",
    hourlyPrice: null,
    perPersonPrice: null,
    sessionPrice: null,
    membershipPlans: [
      { id: "day-pass", label: "Day pass (if offered)", price: null },
      { id: "training", label: "Training session (if offered)", price: null },
    ],
    capacity: null,
    openingHours: null,
    phone: null,
    amenities: [],
    availability: "contact",
    verificationStatus: "verified",
    notes: "Mapped hotel listing. Public access to any leisure facilities is not confirmed.",
    availableTimeSlots: [],
  },
];

export const facilities: Facility[] = [
  ...footballFacilities,
  ...courtFacilities,
  ...universityFacilities,
  ...gymFacilities,
  ...recreationFacilities,
];

export function getFacilityById(id: string): Facility | undefined {
  return facilities.find((facility) => facility.id === id);
}

export function pricingLabel(facility: Facility): string {
  switch (facility.pricingType) {
    case "hourly":
      return facility.hourlyPrice !== null
        ? `${facility.hourlyPrice.toLocaleString("en-US")} ETB per hour`
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
    "Bookings lock the full time window against double bookings.",
    "Payment is not collected online; every player’s share is marked pending.",
    "Pending prices are confirmed by the field owner after the booking.",
    "Cancel or reschedule through the field owner.",
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
