import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/gmail";

export async function processDueScheduledMessages() {
  const now = new Date();

  // Find all messages scheduled on or before now
  const dueMessages = await prisma.scheduledMessage.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: {
        lte: now,
      },
    },
    include: {
      recipients: {
        include: {
          participant: true,
        },
      },
      hackathon: true,
    },
  });

  if (dueMessages.length === 0) {
    return { processed: 0, sent: 0, failed: 0 };
  }

  let totalSent = 0;
  let totalFailed = 0;
  let claimedCount = 0;

  for (const message of dueMessages) {
    // Atomically claim the message: only transition from SCHEDULED to SENDING
    // If another concurrent worker or cron job already claimed this message, claim.count will be 0.
    const claim = await prisma.scheduledMessage.updateMany({
      where: {
        id: message.id,
        status: "SCHEDULED",
      },
      data: {
        status: "SENDING",
      },
    });

    if (claim.count === 0) {
      // Message was already claimed or cancelled by another process
      continue;
    }

    claimedCount++;

    let messageSentCount = 0;
    let messageFailedCount = 0;

    for (const recipient of message.recipients) {
      // Atomically claim recipient: only transition if currently PENDING
      const recipientClaim = await prisma.messageRecipient.updateMany({
        where: {
          id: recipient.id,
          status: "PENDING",
        },
        data: {
          status: "SENDING",
        },
      });

      if (recipientClaim.count === 0) {
        // Recipient already processed or claimed
        continue;
      }

      try {
        const participantName = recipient.participant?.name || "Participant";
        const hackathonName = message.hackathon?.name || "Hackathon";

        // Personalize body and subject if tokens exist
        const personalizedSubject = message.subject
          .replace(/{name}/g, participantName)
          .replace(/{hackathonName}/g, hackathonName);

        const personalizedBody = message.message
          .replace(/{name}/g, participantName)
          .replace(/{hackathonName}/g, hackathonName);

        // Send email via Gmail API
        await sendEmail({
          to: recipient.participant.email,
          subject: personalizedSubject,
          body: personalizedBody,
        });

        // Update recipient record
        await prisma.messageRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "SENT",
            sentAt: new Date(),
            errorMessage: null,
          },
        });

        messageSentCount++;
        totalSent++;
      } catch (err: unknown) {
        const errorMsg =
          err instanceof Error ? err.message : "Unknown sending error";
        console.error(
          `[Scheduler] Error sending to ${recipient.participant?.email}:`,
          errorMsg
        );

        await prisma.messageRecipient.update({
          where: { id: recipient.id },
          data: {
            status: "FAILED",
            errorMessage: errorMsg,
          },
        });

        messageFailedCount++;
        totalFailed++;
      }
    }

    // Determine final message status based on recipient states
    const finalStatus =
      messageFailedCount > 0 && messageSentCount === 0
        ? "FAILED"
        : "SENT";

    await prisma.scheduledMessage.update({
      where: { id: message.id },
      data: {
        status: finalStatus,
        sentAt: new Date(),
      },
    });
  }

  return {
    processed: claimedCount,
    sent: totalSent,
    failed: totalFailed,
  };
}
