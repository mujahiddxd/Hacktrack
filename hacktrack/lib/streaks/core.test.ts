// Run: npm run test:streaks
import { test } from "node:test";
import assert from "node:assert/strict";
import { addDays, buildGrid, computeStreak, dateInZone, diffDays, intensityLevel, isValidDateKey } from "./core";

const days = (...dates: string[]) => dates.map((date) => ({ date, count: 1 }));

test("date arithmetic crosses month, year and leap-day boundaries", () => {
  assert.equal(addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(addDays("2025-12-31", 1), "2026-01-01");
  assert.equal(addDays("2024-02-28", 1), "2024-02-29"); // leap year
  assert.equal(addDays("2024-02-29", 1), "2024-03-01");
  assert.equal(addDays("2026-02-28", 1), "2026-03-01"); // not a leap year
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(diffDays("2024-03-01", "2024-02-28"), 2);
  assert.ok(isValidDateKey("2024-02-29"));
  assert.ok(!isValidDateKey("2026-02-29"));
});

test("dateInZone respects each source's midnight", () => {
  // 2026-03-10 20:00 UTC is already the 11th in India (+05:30) but still the 10th in New York
  const instant = new Date("2026-03-10T20:00:00Z");
  assert.equal(dateInZone(instant, "UTC"), "2026-03-10");
  assert.equal(dateInZone(instant, "Asia/Kolkata"), "2026-03-11");
  assert.equal(dateInZone(instant, "America/New_York"), "2026-03-10");
  // One minute before / after midnight in Kolkata
  assert.equal(dateInZone(new Date("2026-03-10T18:29:00Z"), "Asia/Kolkata"), "2026-03-10");
  assert.equal(dateInZone(new Date("2026-03-10T18:30:00Z"), "Asia/Kolkata"), "2026-03-11");
});

test("streak counts consecutive days ending today", () => {
  const s = computeStreak(days("2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"), "2026-10-04");
  assert.deepEqual(s, { current: 4, longest: 4, lastActiveDate: "2026-10-04", activeToday: true });
});

test("streak stays alive when the latest active day is yesterday", () => {
  const s = computeStreak(days("2026-10-02", "2026-10-03"), "2026-10-04");
  assert.equal(s.current, 2);
  assert.equal(s.activeToday, false);
});

test("a missed day breaks the streak", () => {
  const s = computeStreak(days("2026-09-30", "2026-10-01", "2026-10-02"), "2026-10-04");
  assert.equal(s.current, 0);
  assert.equal(s.longest, 3);
  assert.equal(s.lastActiveDate, "2026-10-02");
});

test("streak runs across month, year and leap-day boundaries", () => {
  assert.equal(computeStreak(days("2026-09-29", "2026-09-30", "2026-10-01"), "2026-10-01").current, 3);
  assert.equal(computeStreak(days("2025-12-30", "2025-12-31", "2026-01-01"), "2026-01-01").current, 3);
  assert.equal(computeStreak(days("2024-02-28", "2024-02-29", "2024-03-01"), "2024-03-01").current, 3);
  // Non-leap year: Feb 28 -> Mar 1 is consecutive
  assert.equal(computeStreak(days("2026-02-27", "2026-02-28", "2026-03-01"), "2026-03-01").current, 3);
});

test("duplicates, zero counts and future days don't inflate the streak", () => {
  const s = computeStreak(
    [
      { date: "2026-10-03", count: 2 },
      { date: "2026-10-03", count: 1 }, // duplicate day
      { date: "2026-10-04", count: 0 }, // zero is not activity
      { date: "2026-10-05", count: 3 }, // future relative to "today"
    ],
    "2026-10-04"
  );
  assert.deepEqual(s, { current: 1, longest: 1, lastActiveDate: "2026-10-03", activeToday: false });
});

test("no activity gives an empty streak", () => {
  assert.deepEqual(computeStreak([], "2026-10-04"), { current: 0, longest: 0, lastActiveDate: null, activeToday: false });
});

test("grid marks days outside coverage and in the future as unknown, not zero", () => {
  // Sunday 2026-10-04
  const grid = buildGrid(
    { days: [{ date: "2026-10-02", count: 5 }], rangeStart: "2026-10-01", rangeEnd: "2026-10-04" },
    "2026-10-04",
    2
  );
  assert.equal(grid.length, 2);
  assert.ok(grid.every((col) => col.length === 7));
  const flat = new Map(grid.flat().map((c) => [c.date, c.count]));
  assert.equal(grid[0][0].date, "2026-09-27"); // first column starts on a Sunday
  assert.equal(flat.get("2026-09-30"), null); // before coverage → unknown
  assert.equal(flat.get("2026-10-01"), 0); // covered, no activity → real zero
  assert.equal(flat.get("2026-10-02"), 5);
  assert.equal(flat.get("2026-10-04"), 0);
  assert.equal(flat.get("2026-10-05"), null); // future → unknown
});

test("disconnected sources (no range) render every cell as unknown", () => {
  const grid = buildGrid({ days: [], rangeStart: null, rangeEnd: null }, "2026-10-04", 1);
  assert.ok(grid.flat().every((c) => c.count === null));
});

test("intensity levels", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 6, 7, 30].map(intensityLevel), [0, 1, 2, 2, 3, 3, 4, 4]);
});
