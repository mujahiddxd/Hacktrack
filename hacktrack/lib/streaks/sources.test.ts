// Run: npm run test:streaks
import { test } from "node:test";
import assert from "node:assert/strict";
import { cached, expireStreakCache } from "./sources";
import type { SourceActivity } from "./core";

const good = (userId: string): SourceActivity => ({
  source: "hacktrack",
  status: "connected",
  timeZone: "UTC",
  rangeStart: "2026-10-01",
  rangeEnd: "2026-10-04",
  days: [{ date: "2026-10-03", count: userId === "alice" ? 2 : 9 }],
  lastSyncedAt: "2026-10-04T10:00:00.000Z",
  stale: false,
});

test("a failed refresh keeps the last good result, marked stale", async () => {
  const first = await cached("hacktrack", "alice", "UTC", async () => good("alice"));
  assert.equal(first.stale, false);

  expireStreakCache();
  const second = await cached("hacktrack", "alice", "UTC", async () => {
    throw new Error("database timeout");
  });
  assert.equal(second.status, "connected");
  assert.equal(second.stale, true);
  assert.deepEqual(second.days, first.days); // values untouched
  assert.equal(second.lastSyncedAt, first.lastSyncedAt); // still the last *successful* sync
});

test("a failure with no previous result is an error, never zero activity", async () => {
  const res = await cached("hacktrack", "nobody-yet", "UTC", async () => {
    throw new Error("down");
  });
  assert.equal(res.status, "error");
  assert.equal(res.rangeStart, null); // no coverage → grid shows "no data", not zeros
  assert.deepEqual(res.days, []);
});

test("cache entries are per user, so one user's data is never served to another", async () => {
  expireStreakCache();
  await cached("hacktrack", "alice", "UTC", async () => good("alice"));
  const bob = await cached("hacktrack", "bob", "UTC", async () => good("bob"));
  assert.equal(bob.days[0].count, 9);
  const alice = await cached("hacktrack", "alice", "UTC", async () => good("bob")); // fresh hit must stay alice's
  assert.equal(alice.days[0].count, 2);
});
