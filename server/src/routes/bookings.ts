import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAdmin } from "../auth";

const router = Router();

const bookingSchema = z.object({
  slotId: z.string().min(1),
  serviceId: z.string().min(1),
  clientName: z.string().min(1),
  clientPhone: z.string().min(1),
  clientEmail: z.string().email(),
  note: z.string().optional(),
});

// Public: request a booking against an open slot.
router.post("/", async (req, res) => {
  const parsed = bookingSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { slotId, serviceId, clientName, clientPhone, clientEmail, note } = parsed.data;

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const slot = await tx.slot.findUnique({ where: { id: slotId } });
      if (!slot || slot.status !== "OPEN") {
        throw new Error("SLOT_UNAVAILABLE");
      }
      const service = await tx.service.findUnique({ where: { id: serviceId } });
      if (!service || !service.active) {
        throw new Error("SERVICE_UNAVAILABLE");
      }
      await tx.slot.update({ where: { id: slotId }, data: { status: "BOOKED" } });
      return tx.booking.create({
        data: { slotId, serviceId, clientName, clientPhone, clientEmail, note },
        include: { slot: true, service: true },
      });
    });
    res.status(201).json(booking);
  } catch (err: any) {
    if (err.message === "SLOT_UNAVAILABLE") {
      return res.status(409).json({ error: "That time was just booked by someone else — please pick another." });
    }
    if (err.message === "SERVICE_UNAVAILABLE") {
      return res.status(400).json({ error: "That service is no longer available." });
    }
    throw err;
  }
});

// Admin: list bookings, most recent first.
router.get("/", requireAdmin, async (_req, res) => {
  const bookings = await prisma.booking.findMany({
    orderBy: { createdAt: "desc" },
    include: { slot: true, service: true },
  });
  res.json(bookings);
});

const statusSchema = z.object({
  status: z.enum(["CONFIRMED", "DECLINED"]),
});

router.put("/:id/status", requireAdmin, async (req, res) => {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  const updated = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.update({
      where: { id: req.params.id },
      data: { status: parsed.data.status },
      include: { slot: true, service: true },
    });
    if (parsed.data.status === "DECLINED") {
      await tx.slot.update({ where: { id: b.slotId }, data: { status: "OPEN" } });
    }
    return b;
  });

  res.json(updated);
});

export default router;
