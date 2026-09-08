import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// A generic, one-off way to correct a service's details after it's already
// been seeded (seed.ts only ever creates services once — it never touches
// them again, since a business's admin may have edited them by hand since).
// Set SERVICE_FIX to a JSON array of { name, description?, priceCents?,
// durationMin? } — each is matched by exact current name and updated with
// whatever fields are given. Safe to leave wired into every deploy: with
// no SERVICE_FIX set, this is a no-op. Unset it again after use so a later
// deploy doesn't silently re-overwrite someone's own edit to that service.
async function main() {
  const raw = process.env.SERVICE_FIX;
  if (!raw) {
    console.log("No SERVICE_FIX set — nothing to fix.");
    return;
  }

  let fixes: { name: string; description?: string; priceCents?: number; durationMin?: number }[];
  try {
    fixes = JSON.parse(raw);
    if (!Array.isArray(fixes)) throw new Error("not an array");
  } catch (err) {
    console.error("SERVICE_FIX is set but isn't valid JSON — skipping.", err);
    return;
  }

  for (const { name, ...updates } of fixes) {
    if (!name) {
      console.error("Skipping a SERVICE_FIX entry with no name.");
      continue;
    }
    const result = await prisma.service.updateMany({ where: { name }, data: updates });
    console.log(`SERVICE_FIX: matched and updated ${result.count} service(s) named "${name}".`);
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
