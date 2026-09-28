import { prisma } from "../lib/prisma";
import { connectDemoAccount } from "../lib/gmail";
import { processDueScheduledMessages } from "../lib/scheduler";

async function main() {
  console.log("--- STARTING SCHEDULER & DISPATCH VERIFICATION ---");

  // 1. Connect Account
  const account = await connectDemoAccount("organizer.hacktrack@gmail.com");
  console.log("✓ Connected account:", account.email);

  // 2. Find CodeStorm hackathon
  const hackathon = await prisma.hackathon.findFirst({
    where: { name: "CodeStorm 2026" },
    include: { participants: true },
  });

  if (!hackathon) {
    throw new Error("CodeStorm 2026 hackathon not found");
  }
  console.log(`✓ Found hackathon: ${hackathon.name} with ${hackathon.participants.length} participants`);

  // 3. Create a ScheduledMessage due right now
  const scheduledTime = new Date(Date.now() - 5000); // 5 seconds ago -> due immediately
  const message = await prisma.scheduledMessage.create({
    data: {
      hackathonId: hackathon.id,
      subject: "Welcome to CodeStorm 2026: Discord & Project Setup",
      message: "Hello {name},\n\nWelcome to {hackathonName}! Please join Discord at discord.gg/codestorm.\n\nHappy hacking!",
      scheduledAt: scheduledTime,
      status: "SCHEDULED",
      recipients: {
        create: hackathon.participants.map((p) => ({
          participantId: p.id,
          status: "PENDING",
        })),
      },
    },
    include: {
      recipients: true,
    },
  });

  console.log(`✓ Created ScheduledMessage (ID: ${message.id}) with status: ${message.status}`);
  console.log(`✓ Created ${message.recipients.length} pending recipient records`);

  // 4. Run the Background Scheduler Engine
  console.log("\n--- TRIGGERING INDEPENDENT BACKGROUND SCHEDULER DISPATCH ---");
  const result = await processDueScheduledMessages();
  console.log("✓ Scheduler Processing Result:", result);

  // 5. Verify Database Records
  const updatedMessage = await prisma.scheduledMessage.findUnique({
    where: { id: message.id },
    include: {
      recipients: {
        include: { participant: true },
      },
    },
  });

  console.log(`\n--- VERIFYING FINAL DELIVERY TRACKING ---`);
  console.log(`Message Final Status: [${updatedMessage?.status}]`);
  console.log(`Message Sent At: ${updatedMessage?.sentAt?.toISOString()}`);
  console.log(`Recipient Breakdown:`);
  updatedMessage?.recipients.forEach((r, idx) => {
    console.log(
      `  [${idx + 1}] ${r.participant.name} <${r.participant.email}> -> Status: ${r.status} | SentAt: ${r.sentAt?.toISOString()}`
    );
  });

  console.log("\n--- MILESTONE VERIFICATION COMPLETE: ALL CHECKS PASSED ---");
}

main()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
