/**
 * Administrator data access for Dire Sport Fields.
 *
 * Reads are protected by Firestore rules and every mutation is routed through a
 * callable Cloud Function. Both layers authorize against the server-managed
 * `users/{uid}` Firestore record.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { adminAuth as auth, adminDb as db, adminFunctions as functions } from "./firebase";
import { isActiveAdminRecord } from "./adminRole.mjs";
import { getManagedFacilities } from "./facilityStore";
import { eatNowParts } from "./eatTime.mjs";

function configured() {
  if (!auth || !db || !functions) {
    throw new Error(
      "Firebase is not configured. Add the existing project configuration to .env.local.",
    );
  }
}

export async function verifyAdminUser(user, forceRefresh = true) {
  if (!user || user.isAnonymous || !db) return false;

  // Ensure Firestore has a current authenticated token, but do not use token
  // claims as the authorization source.
  await user.getIdToken(forceRefresh);
  const snapshot = await getDoc(doc(db, "users", user.uid));
  return snapshot.exists() && isActiveAdminRecord(snapshot.data());
}

export async function requireAdminUser() {
  configured();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user || !(await verifyAdminUser(user, false))) {
    throw new Error("Administrator access is required.");
  }
  return user;
}

async function callAdminFunction(name, data = {}) {
  configured();
  await requireAdminUser();
  const invoke = httpsCallable(functions, name);
  try {
    return (await invoke(data)).data;
  } catch (error) {
    throw new Error(error?.message || "The administrator action could not be completed.");
  }
}

async function readCollection(name, { pageSize = 100, filters = [] } = {}) {
  configured();
  await requireAdminUser();
  const clauses = filters.map(([field, operator, value]) => where(field, operator, value));
  const snapshot = await getDocs(
    query(
      collection(db, name),
      ...clauses,
      orderBy("createdAt", "desc"),
      limit(Math.min(Math.max(Number(pageSize) || 100, 1), 1_000)),
    ),
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export function getAllBookings({ pageSize = 200 } = {}) {
  return readCollection("bookingGroups", { pageSize });
}

export function getAllPaymentAttempts({ pageSize = 200 } = {}) {
  return readCollection("paymentAttempts", { pageSize });
}

export function getAllPaymentReviews({ pageSize = 200 } = {}) {
  return readCollection("paymentReviews", { pageSize });
}

export function getAllFacilityRequests({ pageSize = 200 } = {}) {
  return readCollection("facilityRequests", { pageSize });
}

export function getFacilityRequestsByStatus(status, { pageSize = 200 } = {}) {
  return readCollection("facilityRequests", {
    pageSize,
    filters: [["status", "==", status]],
  });
}

export function getAllReviews({ pageSize = 200, status } = {}) {
  return readCollection("reviews", {
    pageSize,
    filters: status ? [["status", "==", status]] : [],
  });
}

export function getAllFeedback({ pageSize = 200 } = {}) {
  return readCollection("feedback", { pageSize });
}

export function getAdminNotifications({ pageSize = 100 } = {}) {
  return readCollection("adminNotifications", { pageSize });
}

export function getAdminActivityLog({ pageSize = 200 } = {}) {
  return readCollection("adminActivityLog", { pageSize });
}

function timestampMillis(value) {
  if (typeof value?.toMillis === "function") return value.toMillis();
  const parsed = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getCustomers() {
  configured();
  await requireAdminUser();
  const [bookings, requests, metadata] = await Promise.all([
    getDocs(query(collection(db, "bookingGroups"), orderBy("createdAt", "desc"), limit(1_000))),
    getDocs(query(collection(db, "facilityRequests"), orderBy("createdAt", "desc"), limit(1_000))),
    getDocs(collection(db, "customerAdmin")),
  ]);
  const adminByUid = new Map(metadata.docs.map((item) => [item.id, item.data()]));
  const byUid = new Map();

  function add(snapshot, source) {
    const data = snapshot.data();
    const uid = data.ownerUid;
    if (!uid) return;
    const current = byUid.get(uid) ?? {
      id: uid,
      uid,
      name: "",
      phone: "",
      email: "",
      bookings: 0,
      confirmedBookings: 0,
      requests: 0,
      totalSpent: 0,
      lastActivity: null,
      status: adminByUid.get(uid)?.status ?? "active",
      adminNote: adminByUid.get(uid)?.adminNote ?? "",
    };
    current.name ||= data.customerName ?? "";
    current.phone ||= data.customerPhone ?? "";
    current.email ||= data.customerEmail ?? "";
    if (source === "booking") {
      current.bookings += 1;
      if (data.status === "confirmed") current.confirmedBookings += 1;
      if (data.paymentStatus === "paid") {
        current.totalSpent += Number(data.totalPriceEtb) || 0;
      }
    } else {
      current.requests += 1;
    }
    if (timestampMillis(data.createdAt) > timestampMillis(current.lastActivity)) {
      current.lastActivity = data.createdAt;
    }
    byUid.set(uid, current);
  }

  bookings.docs.forEach((item) => add(item, "booking"));
  requests.docs.forEach((item) => add(item, "request"));
  return [...byUid.values()].sort(
    (a, b) => timestampMillis(b.lastActivity) - timestampMillis(a.lastActivity),
  );
}

export async function getCustomerBookings(ownerUid) {
  configured();
  await requireAdminUser();
  const snapshot = await getDocs(
    query(
      collection(db, "bookingGroups"),
      where("ownerUid", "==", ownerUid),
      orderBy("createdAt", "desc"),
      limit(500),
    ),
  );
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
}

export async function getDashboardStats() {
  configured();
  await requireAdminUser();
  const [
    bookingsSnapshot,
    attemptsSnapshot,
    paymentReviewsSnapshot,
    requestsSnapshot,
    customerReviewsSnapshot,
    feedbackSnapshot,
    facilities,
    customers,
  ] = await Promise.all([
    getDocs(collection(db, "bookingGroups")),
    getDocs(collection(db, "paymentAttempts")),
    getDocs(collection(db, "paymentReviews")),
    getDocs(collection(db, "facilityRequests")),
    getDocs(collection(db, "reviews")),
    getDocs(collection(db, "feedback")),
    getManagedFacilities(),
    getCustomers(),
  ]);
  const bookings = bookingsSnapshot.docs.map((item) => item.data());
  const paymentAttempts = attemptsSnapshot.docs.map((item) => item.data());
  const paymentReviews = paymentReviewsSnapshot.docs.map((item) => item.data());
  const requests = requestsSnapshot.docs.map((item) => item.data());
  const customerReviews = customerReviewsSnapshot.docs.map((item) => item.data());
  const feedback = feedbackSnapshot.docs.map((item) => item.data());
  const today = eatNowParts().date;

  return {
    totalBookings: bookings.length,
    todayBookings: bookings.filter((item) => item.date === today).length,
    confirmedBookings: bookings.filter((item) => item.status === "confirmed").length,
    pendingBookings: bookings.filter((item) => item.status === "pending_payment").length,
    expiredBookings: bookings.filter((item) => item.status === "expired").length,
    cancelledBookings: bookings.filter((item) => item.status === "cancelled").length,
    totalRevenue: bookings
      .filter((item) => item.paymentStatus === "paid")
      .reduce((sum, item) => sum + (Number(item.totalPriceEtb) || 0), 0),
    pendingPaymentValue: bookings
      .filter((item) => item.status === "pending_payment")
      .reduce((sum, item) => sum + (Number(item.totalPriceEtb) || 0), 0),
    totalPaymentAttempts: paymentAttempts.length,
    successfulPayments: paymentAttempts.filter((item) => item.status === "paid").length,
    pendingReviews: paymentReviews.filter((item) => item.refundStatus === "manual_review").length,
    pendingFacilityRequests: requests.filter((item) => item.status === "pending").length,
    totalFacilityRequests: requests.length,
    activeFacilities: facilities.filter(
      (item) => item.isPublished !== false && !item.archivedAt,
    ).length,
    totalCustomers: customers.length,
    pendingCustomerReviews: customerReviews.filter((item) => item.status === "pending").length,
    newFeedback: feedback.filter((item) => item.status === "new").length,
  };
}

export async function getReviewDashboardStats() {
  configured();
  await requireAdminUser();
  const [reviews, feedback] = await Promise.all([
    getDocs(collection(db, "reviews")),
    getDocs(collection(db, "feedback")),
  ]);
  return {
    pendingCustomerReviews: reviews.docs.filter((item) => item.data().status === "pending").length,
    newFeedback: feedback.docs.filter((item) => item.data().status === "new").length,
  };
}

export async function getAdminProfile() {
  const user = await requireAdminUser();
  const snapshot = await getDoc(doc(db, "adminProfiles", user.uid));
  return {
    uid: user.uid,
    email: user.email ?? "",
    displayName: snapshot.data()?.displayName ?? user.displayName ?? "",
    phone: snapshot.data()?.phone ?? "",
    ...(snapshot.exists() ? snapshot.data() : {}),
  };
}

export async function getPlatformSettings() {
  configured();
  await requireAdminUser();
  const snapshot = await getDoc(doc(db, "platformSettings", "general"));
  return {
    platformName: "Dire Sport Fields",
    supportEmail: "",
    supportPhone: "",
    maintenanceMessage: "",
    bookingEnabled: true,
    ...(snapshot.exists() ? snapshot.data() : {}),
  };
}

export function cancelBookingAsAdmin(data) {
  return callAdminFunction("adminCancelBooking", data);
}

export function updateFacilityRequestStatus(data) {
  return callAdminFunction("adminUpdateFacilityRequest", data);
}

export function saveFacility(facility, source) {
  return callAdminFunction("adminUpsertFacility", { facility, source });
}

export function archiveFacility(facility, source) {
  return callAdminFunction("adminArchiveFacility", { facility, source });
}

export function moderateReview(data) {
  return callAdminFunction("adminModerateReview", data);
}

export function updateFeedback(data) {
  return callAdminFunction("adminUpdateFeedback", data);
}

export function createAdminNotification(data) {
  return callAdminFunction("adminCreateNotification", data);
}

export function updateAdminNotification(notificationId, notification) {
  return callAdminFunction("adminUpdateNotification", { notificationId, notification });
}

export function archiveAdminNotification(notificationId) {
  return callAdminFunction("adminArchiveNotification", { notificationId });
}

export function updateCustomerAdmin(data) {
  return callAdminFunction("adminUpdateCustomer", data);
}

export function updateAdminProfile(data) {
  return callAdminFunction("adminUpdateProfile", data);
}

export function updatePlatformSettings(data) {
  return callAdminFunction("adminUpdateSettings", data);
}

export function updateRefundStatus(data) {
  return callAdminFunction("updateRefundStatus", data);
}
