import { PrismaClient } from "@prisma/client";

/**
 * One-time migration for the move to multi-user accounts: assigns hackathons and the
 * Gmail token created in single-admin mode to one owner account.
 *
 * Owner = BACKFILL_OWNER_EMAIL, else ADMIN_EMAIL, else the oldest account.
 */
const prisma = new PrismaClient();

async function main() {
  const ownerEmail = (process.env.BACKFILL_OWNER_EMAIL || process.env.ADMIN_EMAIL)?.toLowerCase();

  const owner = ownerEmail
    ? await prisma.user.findUnique({ where: { email: ownerEmail } })
    : await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });

  if (!owner) {
    throw new Error(
      `No owner account found${ownerEmail ? ` for ${ownerEmail}` : ""}. Run \`npm run seed\` or register first.`
    );
  }

  const hackathons = await prisma.hackathon.updateMany({
    where: { userId: null },
    data: { userId: owner.id },
  });

  let tokenAssigned = 0;
  const ownerHasToken = await prisma.googleAuthToken.findUnique({ where: { userId: owner.id } });
  if (!ownerHasToken) {
    const legacy = await prisma.googleAuthToken.findFirst({ where: { userId: null } });
    if (legacy) {
      await prisma.googleAuthToken.update({ where: { id: legacy.id }, data: { userId: owner.id } });
      tokenAssigned = 1;
    }
  }

  console.log(`Owner: ${owner.email}`);
  console.log(`Hackathons assigned: ${hackathons.count}`);
  console.log(`Gmail token assigned: ${tokenAssigned}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
