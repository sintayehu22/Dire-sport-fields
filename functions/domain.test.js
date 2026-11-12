import assert from "node:assert/strict";
import test from "node:test";
import {
  getPaymentDisposition,
  isBookingPaymentExpired,
  normalizeEthiopianPhone,
  PAYMENT_WINDOW_MS,
  validateBookingInput,
} from "./domain.js";

const catalog = {
  field: {
    hourlyPriceEtb: 900,
    maxPlayers: 22,
    availableTimeSlots: ["15:00", "16:00", "17:00"],
  },
};

const validInput = {
  facilityId: "field",
  customerName: "Test Customer",
  customerEmail: "customer@example.com",
  customerPhone: "+251912345678",
  date: "2026-11-10",
  startTime: "15:00",
  durationHours: 2,
  playerCount: 10,
};

test("booking input uses canonical slots and Ethiopian phone formatting", () => {
  const booking = validateBookingInput(validInput, catalog, {
    date: "2026-11-09",
    minutes: 0,
  });
  assert.deepEqual(booking.reservedSlots, ["15:00", "16:00"]);
  assert.equal(booking.customerPhone, "0912345678");
  assert.equal(normalizeEthiopianPhone("0912345678"), "0912345678");
  assert.equal(normalizeEthiopianPhone("123"), null);
});

test("booking validation rejects unlisted and unavailable times", () => {
  assert.throws(
    () => validateBookingInput({ ...validInput, facilityId: "unknown" }, catalog, { date: "2026-11-09", minutes: 0 }),
    /not available/,
  );
  assert.throws(
    () => validateBookingInput({ ...validInput, startTime: "18:00" }, catalog, { date: "2026-11-09", minutes: 0 }),
    /outside this field's available hours/,
  );
  assert.throws(
    () => validateBookingInput({ ...validInput, date: "2026-02-30" }, catalog, { date: "2026-02-01", minutes: 0 }),
    /valid booking date/,
  );
});

test("the payment window is exactly thirty minutes", () => {
  assert.equal(PAYMENT_WINDOW_MS, 30 * 60 * 1000);
});

test("payment expiry uses the exact deadline and safely expires legacy pending bookings", () => {
  const paymentDeadline = {
    status: "pending_payment",
    paymentExpiresAt: { toMillis: () => 1_800_000 },
  };
  assert.equal(isBookingPaymentExpired(paymentDeadline, 1_799_999), false);
  assert.equal(isBookingPaymentExpired(paymentDeadline, 1_800_000), true);

  const legacyPending = {
    status: "pending",
    createdAt: { toMillis: () => 1000 },
  };
  assert.equal(
    isBookingPaymentExpired(legacyPending, 1000 + PAYMENT_WINDOW_MS - 1),
    false,
  );
  assert.equal(
    isBookingPaymentExpired(legacyPending, 1000 + PAYMENT_WINDOW_MS),
    true,
  );
  assert.equal(isBookingPaymentExpired({ status: "pending" }, 10_000), true);
});

const attempt = { txRef: "DSF-reference", amountEtb: 1800, currency: "ETB" };
const verification = {
  status: "success",
  data: { tx_ref: attempt.txRef, amount: "1800", currency: "ETB", status: "success" },
};
const booking = {
  status: "pending_payment",
  paymentExpiresAt: { toMillis: () => 1_800_000 },
};

test("verified matching payment confirms only before expiry with active locks", () => {
  assert.deepEqual(
    getPaymentDisposition({
      booking,
      attempt,
      verification,
      now: 1_799_999,
      reservationsMatch: true,
    }),
    { type: "confirm" },
  );
});

test("provider-pending transactions remain pending rather than failing the booking", () => {
  assert.deepEqual(
    getPaymentDisposition({
      booking,
      attempt,
      verification: {
        status: "success",
        data: {
          tx_ref: attempt.txRef,
          amount: "1800",
          currency: "ETB",
          status: "pending",
        },
      },
      now: 1_000,
      reservationsMatch: true,
    }),
    { type: "pending" },
  );
});

test("late or mismatched payments require review and never confirm", () => {
  assert.equal(
    getPaymentDisposition({
      booking,
      attempt,
      verification,
      now: 1_800_000,
      reservationsMatch: true,
    }).type,
    "review",
  );
  assert.equal(
    getPaymentDisposition({
      booking,
      attempt,
      verification: {
        ...verification,
        data: { ...verification.data, amount: "1801" },
      },
      now: 1_000,
      reservationsMatch: true,
    }).type,
    "review",
  );
});

test("overwritten reservation locks require review rather than confirmation", () => {
  assert.equal(
    getPaymentDisposition({
      booking,
      attempt,
      verification,
      now: 1_000,
      reservationsMatch: false,
    }).type,
    "review",
  );
});
