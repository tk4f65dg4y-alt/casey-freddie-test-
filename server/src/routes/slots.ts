import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAdmin } from "../auth";

const router = Router();

// Public: open slots from now onward.
router.get("/", async (_req, res) => {
  const slots = await prisma.slot.findMany({
    where: { status: "OPEN", startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
  });
  res.json(slots);
});

// Admin: all upcoming slots (open + booked), with the slot's current
// (non-declined) booking, if any — a slot can have older declined
// bookings in its history, but at most one active one at a time.
router.get("/all", requireAdmin, async (_req, res) => {
  const slots = await prisma.slot.findMany({
    where: { startsAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    orderBy: { startsAt: "asc" },
    include: {
      bookings: { where: { status: { not: "DECLINED" } }, include: { service: true } },
    },
  });
  res.json(slots.map(({ bookings, ...slot }) => ({ ...slot, booking: bookings[0] ?? null })));
});

const slotSchema = z.object({
  startsAt: z.string().datetime(),
  durationMin: z.number().int().positive(),
});

router.post("/", requireAdmin, async (req, res) => {
  const parsed = slotSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const slot = await prisma.slot.create({
    data: { startsAt: new Date(parsed.data.startsAt), durationMin: parsed.data.durationMin },
  });
  res.status(201).json(slot);
});

const batchSchema = z.object({
  dates: z.array(z.string().datetime()),
  durationMin: z.number().int().positive(),
});

// Create many slots at once (e.g. "open up these times this week").
router.post("/batch", requireAdmin, async (req, res) => {
  const parsed = batchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { dates, durationMin } = parsed.data;
  const created = await prisma.$transaction(
    dates.map((d) => prisma.slot.create({ data: { startsAt: new Date(d), durationMin } }))
  );
  res.status(201).json(created);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const slot = await prisma.slot.findUnique({ where: { id: req.params.id } });
  if (!slot) return res.status(404).json({ error: "Slot not found" });
  if (slot.status === "BOOKED") {
    return res.status(400).json({ error: "Can't remove a booked slot — decline the booking first" });
  }
  await prisma.slot.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

export default router;
