import assert from "node:assert/strict";
import test from "node:test";
import {
  validateFacilityPayload,
  validateFeedbackPayload,
  validateNotificationPayload,
  validateReviewPayload,
} from "./admin-domain.js";

const validFacility = {
  id: "test-football-field",
  name: "Test Football Field",
  category: "football",
  activities: ["football"],
  description: "A verified description long enough for validation.",
  neighborhood: "Dire Dawa",
  images: ["/images/fields/field-placeholder.svg"],
  pricingType: "hourly",
  hourlyPrice: 900,
  availability: "bookable",
  verificationStatus: "verified",
  availableTimeSlots: ["16:00", "15:00", "16:00"],
  isPublished: true,
};

test("facility validation normalizes a managed bookable venue", () => {
  const facility = validateFacilityPayload(validFacility);
  assert.equal(facility.id, "test-football-field");
  assert.deepEqual(facility.availableTimeSlots, ["15:00", "16:00"]);
  assert.equal(facility.maxPlayers, 22);
});

test("bookable facility validation requires trusted price and slots", () => {
  assert.throws(
    () => validateFacilityPayload({ ...validFacility, hourlyPrice: null }),
    /require hourly pricing/,
  );
  assert.throws(
    () => validateFacilityPayload({ ...validFacility, availableTimeSlots: ["15:30"] }),
    /whole-hour/,
  );
});

test("notification, review, and feedback payloads reject invalid values", () => {
  assert.equal(
    validateNotificationPayload({
      title: "Maintenance notice",
      message: "Bookings will briefly be unavailable.",
      type: "warning",
      audience: "all",
      status: "published",
    }).type,
    "warning",
  );
  assert.throws(
    () => validateReviewPayload({ bookingId: "booking-123", facilityId: "field-1", rating: 6, comment: "A useful review." }),
    /1 to 5/,
  );
  assert.throws(
    () => validateFeedbackPayload({ name: "Customer", email: "invalid", message: "A detailed feedback message.", category: "general" }),
    /valid email/,
  );
});
