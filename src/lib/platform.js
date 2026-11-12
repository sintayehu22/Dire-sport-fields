import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

const FEEDBACK_TOPICS = [
  "general",
  "booking",
  "payment",
  "facility",
  "technical",
];

function getDatabase() {
  if (!db) {
    throw new Error(
      "Firestore is not configured. Add the Firebase environment variables and restart the application.",
    );
  }

  return db;
}

function cleanRequiredText(value, field, min, max) {
  const text = String(value ?? "").trim();
  if (text.length < min || text.length > max) {
    throw new Error(
      `${field} must be between ${min} and ${max} characters.`,
    );
  }
  return text;
}

export async function getApprovedReviews(facilityId, pageSize = 20) {
  const id = cleanRequiredText(facilityId, "Facility reference", 2, 128);
  const size = Math.min(Math.max(Number(pageSize) || 20, 1), 50);
  const snapshot = await getDocs(
    query(
      collection(getDatabase(), "publicReviews"),
      where("facilityId", "==", id),
      orderBy("publishedAt", "desc"),
      limit(size),
    ),
  );

  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function submitFacilityReview(data) {
  const rating = Number(data?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be a whole number from 1 to 5.");
  }

  const payload = {
    bookingId: cleanRequiredText(
      data?.bookingId,
      "Booking reference",
      8,
      128,
    ),
    facilityId: cleanRequiredText(
      data?.facilityId,
      "Facility reference",
      2,
      128,
    ),
    facilityName: String(data?.facilityName ?? "Facility")
      .trim()
      .slice(0, 150),
    customerName: String(data?.customerName ?? "Customer")
      .trim()
      .slice(0, 100),
    rating,
    comment: cleanRequiredText(data?.comment, "Review", 10, 1500),
    status: "pending",
    createdAt: new Date(),
  };
  const reference = await addDoc(
    collection(getDatabase(), "reviews"),
    payload,
  );

  return { id: reference.id, ...payload };
}

export async function submitPlatformFeedback(data) {
  const topic = String(data?.topic ?? data?.category ?? "general")
    .trim()
    .toLowerCase();
  if (!FEEDBACK_TOPICS.includes(topic)) {
    throw new Error("Choose a valid feedback topic.");
  }

  const email = cleanRequiredText(data?.email, "Email", 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  const payload = {
    name: cleanRequiredText(data?.name, "Name", 2, 100),
    email,
    topic,
    message: cleanRequiredText(data?.message, "Message", 10, 2000),
    createdAt: new Date(),
  };
  const reference = await addDoc(
    collection(getDatabase(), "feedback"),
    payload,
  );

  return { id: reference.id, ...payload };
}

export async function getPublicNotifications(pageSize = 3) {
  const size = Math.min(Math.max(Number(pageSize) || 3, 1), 10);

  try {
    const snapshot = await getDocs(
      query(
        collection(getDatabase(), "adminNotifications"),
        where("status", "==", "published"),
        where("audience", "in", ["all", "customers"]),
        orderBy("createdAt", "desc"),
        limit(size),
      ),
    );
    return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  } catch {
    return [];
  }
}

export async function getPublicPlatformSettings() {
  const defaults = {
    platformName: "Dire Sport Fields",
    supportEmail: "",
    supportPhone: "",
    maintenanceMessage: "",
    bookingEnabled: true,
  };

  try {
    const snapshot = await getDoc(
      doc(getDatabase(), "platformSettings", "general"),
    );
    return snapshot.exists() ? { ...defaults, ...snapshot.data() } : defaults;
  } catch {
    return defaults;
  }
}
