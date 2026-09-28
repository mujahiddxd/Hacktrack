import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@hacktrack.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "adminpassword123";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: {
      email: adminEmail,
      name: "Super Admin",
      passwordHash,
    },
  });

  console.log(`Admin account created / updated: ${admin.email}`);

  // Create sample hackathons if none exist
  const count = await prisma.hackathon.count();
  if (count === 0) {
    const hackathon1 = await prisma.hackathon.create({
      data: {
        name: "CodeStorm 2026",
        description: "The ultimate 48-hour global hackathon building the future of autonomous systems and Web3.",
        roundDetails: "Round 1: Idea Submission & Prototype\nRound 2: Live Demo & Code Review\nRound 3: Grand Finale Pitch",
        hackathonDate: new Date("2026-10-15T09:00:00Z"),
        registrationDeadline: new Date("2026-10-10T23:59:59Z"),
        fee: "₹500",
        location: "Online / Discord",
        registrationLink: "https://codestorm2026.dev",
        participants: {
          create: [
            { name: "Rahul Sharma", email: "rahul@gmail.com" },
            { name: "Aditya Patil", email: "aditya@gmail.com" },
            { name: "Akash Kumar", email: "akash@gmail.com" },
            { name: "Pooja Verma", email: "pooja@gmail.com" },
          ],
        },
      },
    });

    const hackathon2 = await prisma.hackathon.create({
      data: {
        name: "AI Genesis 2026",
        description: "A premier generative AI hackathon tackling multimodal reasoning, agents, and robotics.",
        roundDetails: "Preliminary Screening -> Model Evaluation -> Final Showcase",
        hackathonDate: new Date("2026-11-20T10:00:00Z"),
        registrationDeadline: new Date("2026-11-15T18:00:00Z"),
        fee: "Free",
        location: "Bangalore Innovation Hub",
        registrationLink: "https://aigenesis.tech",
        participants: {
          create: [
            { name: "Sneha Patel", email: "sneha@gmail.com" },
            { name: "Rohan Gupta", email: "rohan@gmail.com" },
          ],
        },
      },
    });

    console.log("Seeded sample hackathons:", hackathon1.name, hackathon2.name);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
