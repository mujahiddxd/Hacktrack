import { processDueScheduledMessages } from "../lib/scheduler";

const POLLING_INTERVAL_MS = 15000; // Check every 15 seconds

console.log("==========================================");
console.log("  HACKTRACK BACKGROUND EMAIL SCHEDULER   ");
console.log("  Status: RUNNING                         ");
console.log(`  Interval: ${POLLING_INTERVAL_MS / 1000}s                   `);
console.log("==========================================");

let isRunning = true;

process.on("SIGINT", () => {
  console.log("\n[Worker] Gracefully shutting down...");
  isRunning = false;
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[Worker] Gracefully shutting down...");
  isRunning = false;
  process.exit(0);
});

async function runLoop() {
  while (isRunning) {
    try {
      const timestamp = new Date().toLocaleTimeString();
      const result = await processDueScheduledMessages();
      if (result.processed > 0) {
        console.log(
          `[${timestamp}] Processed ${result.processed} messages. Sent: ${result.sent}, Failed: ${result.failed}`
        );
      }
    } catch (err: unknown) {
      console.error(
        `[Worker Error]:`,
        err instanceof Error ? err.message : err
      );
    }

    // Wait before next check
    await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL_MS));
  }
}

runLoop();
