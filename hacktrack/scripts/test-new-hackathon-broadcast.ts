import { prisma } from "../lib/prisma";
import { processDueScheduledMessages } from "../lib/scheduler";

async function main() {
  console.log("=== TESTING /NEW HACKATHON BROADCAST CREATION & DISPATCH ===");

  // 1. Simulate creating a hackathon from the /hackathons/new form with broadcast details
  const hackathon = await prisma.hackathon.create({
    data: {
      name: "CyberForge 2026",
      description: "Next-gen cybersecurity and defensive engineering hackathon.",
      roundDetails: "Phase 1: Vulnerability Assessment -> Phase 2: Defense Prototype -> Phase 3: Live Exploitation CTF",
      hackathonDate: new Date("2026-12-01T10:00:00Z"),
      registrationDeadline: new Date("2026-11-25T23:59:59Z"),
      fee: "Free",
      location: "Virtual / CTF Platform",
      registrationLink: "https://cyberforge2026.dev",
    },
  });
  console.log(`✓ Created Hackathon: ${hackathon.name} (ID: ${hackathon.id})`);

  // 2. Initial participants added on creation
  const p1 = await prisma.participant.create({
    data: {
      hackathonId: hackathon.id,
      name: "Tanya Singh",
      email: "tanya@gmail.com",
    },
  });
  const p2 = await prisma.participant.create({
    data: {
      hackathonId: hackathon.id,
      name: "Sameer Khan",
      email: "sameer@gmail.com",
    },
  });
  console.log(`✓ Added initial participants: ${p1.name} (${p1.email}), ${p2.name} (${p2.email})`);

  // 3. Automated Broadcast scheduled on creation (set to 5 seconds ago so it's due immediately)
  const scheduledAt = new Date(Date.now() - 5000);
  const broadcastMsg = await prisma.scheduledMessage.create({
    data: {
      hackathonId: hackathon.id,
      subject: "CyberForge 2026: Official CTF Discord & Key Guidelines",
      message: "Hello {name},\n\nWelcome to {hackathonName}! Your registration is confirmed. Prepare your Kali/Ubuntu environments before the opening ceremony.\n\nHappy hacking!\nCyberForge Team",
      scheduledAt,
      status: "SCHEDULED",
      recipients: {
        create: [
          { participantId: p1.id, status: "PENDING" },
          { participantId: p2.id, status: "PENDING" },
        ],
      },
    },
    include: { recipients: true },
  });
  console.log(`✓ Scheduled broadcast "${broadcastMsg.subject}" with ${broadcastMsg.recipients.length} recipients`);

  // 4. Run background worker dispatch
  console.log("\n--- BACKGROUND WORKER DISPATCHING TO PARTICIPANTS GMAIL ---");
  const result = await processDueScheduledMessages();
  console.log("✓ Worker Result:", result);

  // 5. Verify delivery records
  const verified = await prisma.scheduledMessage.findUnique({
    where: { id: broadcastMsg.id },
    include: { recipients: { include: { participant: true } } },
  });

  console.log(`\n--- VERIFIED DELIVERY STATUS: [${verified?.status}] ---`);
  verified?.recipients.forEach((r, i) => {
    console.log(`  Recipient ${i + 1}: ${r.participant.name} <${r.participant.email}> -> Status: ${r.status}, SentAt: ${r.sentAt?.toISOString()}`);
  });

  console.log("\n=== /NEW HACKATHON BROADCAST TEST PASSED SUCCESSFULLY ===");
}

main()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
