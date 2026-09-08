import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Default demo content for the hairdresser example (Gaby's Hair Studio).
// A different deployment of this same app overrides this by setting the
// SEED_SERVICES env var to a JSON array of { name, description, priceCents,
// durationMin } objects — e.g. a personal trainer's session packages
// instead of haircut packages. Existing deployments that don't set it keep
// exactly this content, unchanged.
const DEFAULT_SERVICES = [
  {
    name: "Cut & Finish",
    description: "A precision cut, wash, and blow-dry finish.",
    priceCents: 6500,
    durationMin: 45,
  },
  {
    name: "Colour & Cut",
    description: "Full colour, cut, and blow-dry — includes a consultation.",
    priceCents: 12000,
    durationMin: 120,
  },
  {
    name: "Balayage",
    description: "Hand-painted balayage highlights with gloss and finish.",
    priceCents: 16500,
    durationMin: 150,
  },
  {
    name: "Blow-dry & Style",
    description: "Wash, blow-dry, and finishing style for any occasion.",
    priceCents: 4000,
    durationMin: 30,
  },
  {
    name: "Bridal Trial",
    description: "A full trial run of your wedding-day hair, styled and photographed.",
    priceCents: 9500,
    durationMin: 90,
  },
];

function loadServices(): typeof DEFAULT_SERVICES {
  const raw = process.env.SEED_SERVICES;
  if (!raw) return DEFAULT_SERVICES;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("not a non-empty array");
    return parsed;
  } catch (err) {
    console.error("SEED_SERVICES is set but isn't valid JSON — falling back to the default services.", err);
    return DEFAULT_SERVICES;
  }
}

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "gaby@example.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "change-me";
  const adminName = process.env.ADMIN_NAME || "Gaby";

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: adminName },
    create: { email: adminEmail, passwordHash, name: adminName },
  });
  console.log(`Admin ready: ${adminEmail}`);

  const existingServices = await prisma.service.count();
  if (existingServices === 0) {
    const services = loadServices();
    await prisma.service.createMany({
      data: services.map((s, i) => ({ ...s, sortOrder: i + 1 })),
    });
    console.log(`Seeded ${services.length} services.`);
  }

  const existingSlots = await prisma.slot.count();
  if (existingSlots === 0) {
    const slotsToCreate: { startsAt: Date; durationMin: number }[] = [];
    const now = new Date();
    // Open slots for the next 10 weekdays, three per day.
    let daysAdded = 0;
    let dayOffset = 1;
    while (daysAdded < 10) {
      const day = new Date(now);
      day.setDate(day.getDate() + dayOffset);
      dayOffset += 1;
      const weekday = day.getDay();
      if (weekday === 0 || weekday === 6) continue; // skip weekends
      daysAdded += 1;
      for (const hour of [9, 12, 15]) {
        const slot = new Date(day);
        slot.setHours(hour, 0, 0, 0);
        slotsToCreate.push({ startsAt: slot, durationMin: 60 });
      }
    }
    await prisma.slot.createMany({ data: slotsToCreate });
    console.log(`Seeded ${slotsToCreate.length} open slots.`);
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
