const FACILITY_CATEGORIES = new Set(["football", "basketball", "volleyball"]);
const PRICING_TYPES = new Set([
  "hourly",
  "per_person",
  "per_session",
  "membership",
  "contact",
]);
const AVAILABILITY_STATUSES = new Set(["bookable", "contact", "unavailable"]);
const VERIFICATION_STATUSES = new Set(["verified", "reported", "unverified"]);
const NOTIFICATION_TYPES = new Set(["info", "success", "warning", "error"]);
const NOTIFICATION_AUDIENCES = new Set(["all", "customers", "admins"]);
const NOTIFICATION_STATUSES = new Set(["draft", "published"]);

export function cleanText(value, { field = "Value", min = 0, max = 500 } = {}) {
  const text = String(value ?? "").trim();
  if (text.length < min || text.length > max) {
    throw new Error(`${field} must contain ${min} to ${max} characters.`);
  }
  return text;
}

function optionalText(value, field, max) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  return cleanText(value, { field, max });
}

function optionalNumber(value, field, { min = -Infinity, max = Infinity, integer = false } = {}) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
    throw new Error(`${field} is invalid.`);
  }
  return number;
}

function cleanStringList(value, field, { maxItems = 20, itemMax = 120 } = {}) {
  if (!Array.isArray(value)) return [];
  if (value.length > maxItems) throw new Error(`${field} has too many entries.`);
  return [...new Set(value.map((item) => cleanText(item, { field, min: 1, max: itemMax })) )];
}

export function validateFacilityPayload(data) {
  const id = cleanText(data?.id, { field: "Facility ID", min: 3, max: 80 }).toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new Error("Facility ID must use lowercase letters, numbers, and single hyphens.");
  }

  const category = cleanText(data?.category, { field: "Category", min: 1, max: 30 });
  const pricingType = cleanText(data?.pricingType, { field: "Pricing type", min: 1, max: 30 });
  const availability = cleanText(data?.availability, { field: "Availability", min: 1, max: 30 });
  const verificationStatus = cleanText(data?.verificationStatus, {
    field: "Verification status",
    min: 1,
    max: 30,
  });
  if (!FACILITY_CATEGORIES.has(category)) throw new Error("Unsupported facility category.");
  if (!PRICING_TYPES.has(pricingType)) throw new Error("Unsupported pricing type.");
  if (!AVAILABILITY_STATUSES.has(availability)) throw new Error("Unsupported availability status.");
  if (!VERIFICATION_STATUSES.has(verificationStatus)) throw new Error("Unsupported verification status.");

  const hourlyPrice = optionalNumber(data?.hourlyPrice, "Hourly price", { min: 1, max: 1_000_000 });
  const perPersonPrice = optionalNumber(data?.perPersonPrice, "Per-person price", { min: 1, max: 1_000_000 });
  const sessionPrice = optionalNumber(data?.sessionPrice, "Session price", { min: 1, max: 1_000_000 });
  const capacity = optionalNumber(data?.capacity, "Capacity", { min: 1, max: 1_000_000, integer: true });
  const maxPlayers = optionalNumber(data?.maxPlayers, "Maximum players", { min: 1, max: 30, integer: true });
  const latitude = optionalNumber(data?.latitude, "Latitude", { min: -90, max: 90 });
  const longitude = optionalNumber(data?.longitude, "Longitude", { min: -180, max: 180 });
  if ((latitude === null) !== (longitude === null)) {
    throw new Error("Latitude and longitude must be provided together.");
  }

  const availableTimeSlots = cleanStringList(data?.availableTimeSlots, "Time slots", {
    maxItems: 24,
    itemMax: 5,
  }).sort();
  if (availableTimeSlots.some((slot) => !/^([01]\d|2[0-3]):00$/.test(slot))) {
    throw new Error("Time slots must use whole-hour HH:00 values.");
  }
  if (availability === "bookable") {
    if (pricingType !== "hourly" || hourlyPrice === null || availableTimeSlots.length === 0) {
      throw new Error("Bookable facilities require hourly pricing and at least one time slot.");
    }
  }

  const images = cleanStringList(data?.images, "Images", { maxItems: 6, itemMax: 500 });
  if (images.length === 0) throw new Error("Add at least one facility image.");
  if (images.some((url) => !url.startsWith("/") && !/^https:\/\//i.test(url))) {
    throw new Error("Images must use a local path or an HTTPS URL.");
  }

  const activities = cleanStringList(data?.activities, "Activities", {
    maxItems: 3,
    itemMax: 30,
  });
  if (activities.some((activity) => !FACILITY_CATEGORIES.has(activity))) {
    throw new Error("An activity uses an unsupported category.");
  }
  if (!activities.includes(category)) activities.unshift(category);

  return {
    id,
    name: cleanText(data?.name, { field: "Name", min: 2, max: 120 }),
    category,
    activities,
    description: cleanText(data?.description, { field: "Description", min: 10, max: 2_000 }),
    neighborhood: cleanText(data?.neighborhood, { field: "Neighborhood", min: 2, max: 120 }),
    latitude,
    longitude,
    plusCode: optionalText(data?.plusCode, "Plus code", 50),
    googleMapsUrl: optionalText(data?.googleMapsUrl, "Google Maps URL", 500),
    images,
    pricingType,
    hourlyPrice,
    perPersonPrice,
    sessionPrice,
    membershipPlans: [],
    capacity,
    maxPlayers: maxPlayers ?? Math.min(capacity ?? 22, 30),
    openingHours: optionalText(data?.openingHours, "Opening hours", 200),
    phone: optionalText(data?.phone, "Phone", 40),
    amenities: cleanStringList(data?.amenities, "Amenities", { maxItems: 30, itemMax: 80 }),
    availability,
    verificationStatus,
    notes: optionalText(data?.notes, "Notes", 1_000) ?? "",
    availableTimeSlots,
    isPublished: data?.isPublished !== false,
  };
}

export function validateNotificationPayload(data) {
  const type = cleanText(data?.type ?? "info", { field: "Type", min: 1, max: 20 });
  const audience = cleanText(data?.audience ?? "all", { field: "Audience", min: 1, max: 20 });
  const status = cleanText(data?.status ?? "published", { field: "Status", min: 1, max: 20 });
  if (!NOTIFICATION_TYPES.has(type)) throw new Error("Unsupported notification type.");
  if (!NOTIFICATION_AUDIENCES.has(audience)) throw new Error("Unsupported notification audience.");
  if (!NOTIFICATION_STATUSES.has(status)) throw new Error("Unsupported notification status.");
  return {
    title: cleanText(data?.title, { field: "Title", min: 3, max: 120 }),
    message: cleanText(data?.message, { field: "Message", min: 5, max: 1_000 }),
    type,
    audience,
    status,
  };
}

export function validateReviewPayload(data) {
  const rating = Number(data?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be a whole number from 1 to 5.");
  }
  return {
    bookingId: cleanText(data?.bookingId, { field: "Booking reference", min: 8, max: 128 }),
    facilityId: cleanText(data?.facilityId, { field: "Facility", min: 3, max: 80 }),
    rating,
    comment: cleanText(data?.comment, { field: "Review", min: 10, max: 1_500 }),
  };
}

export function validateFeedbackPayload(data) {
  const category = cleanText(data?.category ?? "general", {
    field: "Category",
    min: 2,
    max: 30,
  });
  if (!["general", "booking", "payment", "facility", "technical"].includes(category)) {
    throw new Error("Unsupported feedback category.");
  }
  const email = cleanText(data?.email, { field: "Email", min: 3, max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  return {
    name: cleanText(data?.name, { field: "Name", min: 2, max: 100 }),
    email,
    category,
    message: cleanText(data?.message, { field: "Message", min: 10, max: 2_000 }),
  };
}
