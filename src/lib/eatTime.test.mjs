import assert from "node:assert/strict";
import test from "node:test";
import {
  computeLockIds,
  eatToUtc,
  formatEatDateLong,
  formatEatTime12,
  intervalsOverlap,
  isValidEatDate,
  isValidEatTime,
  timeFromMinutes,
  utcToEat,
} from "./eatTime.mjs";

test("EAT date and time round-trip independently of the browser timezone", () => {
  const midnightUtc = Date.parse("2026-11-08T21:00:00.000Z");
  assert.deepEqual(utcToEat(midnightUtc), {
    date: "2026-11-09",
    time: "00:00",
    minutes: 0,
  });
  assert.equal(eatToUtc("2026-11-09", "00:00").toISOString(), "2026-11-08T21:00:00.000Z");
  assert.equal(formatEatDateLong("2026-11-09"), "November 9, 2026");
  assert.equal(formatEatTime12("00:00"), "12:00 AM");
});

test("validates civil dates and times, including the end-of-day boundary", () => {
  assert.equal(isValidEatDate("2026-11-09"), true);
  assert.equal(isValidEatDate("2026-02-30"), false);
  assert.equal(isValidEatTime("23:00"), true);
  assert.equal(isValidEatTime("24:00"), false);
  assert.equal(timeFromMinutes(24 * 60), "24:00");
  assert.equal(eatToUtc("2026-11-09", "24:00").toISOString(), "2026-11-09T21:00:00.000Z");
  assert.equal(formatEatTime12("24:00"), "12:00 AM");
});

test("overlap detection rejects shared hours and allows back-to-back windows", () => {
  assert.equal(intervalsOverlap("09:00", "11:00", "10:00", "12:00"), true);
  assert.equal(intervalsOverlap("09:00", "10:00", "10:00", "11:00"), false);
  assert.equal(intervalsOverlap("23:00", "24:00", "22:00", "23:00"), false);
});

test("overlapping hourly bookings share deterministic lock ids", () => {
  const first = computeLockIds("dire-dawa-field", "2026-11-09", "09:00", "11:00");
  const overlap = computeLockIds("dire-dawa-field", "2026-11-09", "10:00", "12:00");
  const backToBack = computeLockIds("dire-dawa-field", "2026-11-09", "11:00", "12:00");

  assert.deepEqual(first, [
    "dire-dawa-field_2026-11-09_09-00",
    "dire-dawa-field_2026-11-09_10-00",
  ]);
  assert.equal(first.some((lockId) => overlap.includes(lockId)), true);
  assert.equal(first.some((lockId) => backToBack.includes(lockId)), false);
});
