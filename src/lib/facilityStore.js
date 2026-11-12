import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import {
  FACILITY_IMAGE_PLACEHOLDERS,
  facilities as catalogFacilities,
} from "./facilities";

function fallbackImage(category) {
  return category === "football"
    ? FACILITY_IMAGE_PLACEHOLDERS.field
    : FACILITY_IMAGE_PLACEHOLDERS.hall;
}

export function mergeFacilityRecord(id, data = {}, base = null) {
  const category = data.category ?? base?.category ?? "football";
  const merged = {
    ...(base ?? {}),
    ...data,
    id,
    category,
    activities:
      Array.isArray(data.activities) && data.activities.length > 0
        ? data.activities
        : base?.activities ?? [category],
    images:
      Array.isArray(data.images) && data.images.length > 0
        ? data.images
        : base?.images ?? [fallbackImage(category)],
    membershipPlans: Array.isArray(data.membershipPlans)
      ? data.membershipPlans
      : base?.membershipPlans ?? [],
    amenities: Array.isArray(data.amenities) ? data.amenities : base?.amenities ?? [],
    availableTimeSlots: Array.isArray(data.availableTimeSlots)
      ? data.availableTimeSlots
      : base?.availableTimeSlots ?? [],
    source: data.source ?? (base ? "catalog" : "custom"),
    isPublished: data.isPublished !== false,
    hasManagedRecord: Object.keys(data).length > 0,
  };

  for (const nullable of [
    "latitude",
    "longitude",
    "plusCode",
    "googleMapsUrl",
    "rating",
    "hourlyPrice",
    "perPersonPrice",
    "sessionPrice",
    "capacity",
    "openingHours",
    "phone",
  ]) {
    if (!(nullable in merged)) merged[nullable] = null;
  }
  if (!("maxPlayers" in merged)) merged.maxPlayers = Math.min(merged.capacity ?? 22, 30);
  if (!("notes" in merged)) merged.notes = "";
  if (!("description" in merged)) merged.description = merged.notes;
  return merged;
}

export function mergeFacilityCollections(managedDocuments = [], { includeUnpublished = false } = {}) {
  const byId = new Map(
    catalogFacilities.map((facility) => [
      facility.id,
      mergeFacilityRecord(facility.id, {}, facility),
    ]),
  );

  for (const managed of managedDocuments) {
    const base = byId.get(managed.id) ?? null;
    const record = mergeFacilityRecord(managed.id, managed, base);
    if (record.name) byId.set(managed.id, record);
  }

  return [...byId.values()]
    .filter(
      (facility) =>
        includeUnpublished ||
        (facility.isPublished !== false && !facility.archivedAt),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function readManagedFacilityDocuments() {
  if (!db) return [];
  const snapshot = await getDocs(collection(db, "facilities"));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function getPublicFacilities() {
  if (!db) return mergeFacilityCollections();
  try {
    return mergeFacilityCollections(await readManagedFacilityDocuments());
  } catch {
    // The verified code catalog remains available if Firestore is temporarily
    // unreachable, so customer discovery is never replaced by fake data.
    return mergeFacilityCollections();
  }
}

export async function getManagedFacilities() {
  if (!db) throw new Error("Firebase is not configured.");
  return mergeFacilityCollections(await readManagedFacilityDocuments(), {
    includeUnpublished: true,
  });
}

export async function getPublicFacility(facilityId) {
  const base = catalogFacilities.find((facility) => facility.id === facilityId) ?? null;
  if (!db) return base ? mergeFacilityRecord(facilityId, {}, base) : null;
  try {
    const snapshot = await getDoc(doc(db, "facilities", facilityId));
    const facility = snapshot.exists()
      ? mergeFacilityRecord(facilityId, snapshot.data(), base)
      : base
        ? mergeFacilityRecord(facilityId, {}, base)
        : null;
    if (!facility || facility.isPublished === false || facility.archivedAt) return null;
    return facility;
  } catch {
    return base ? mergeFacilityRecord(facilityId, {}, base) : null;
  }
}

export { catalogFacilities };
