import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAdmin } from "../auth";

const router = Router();

// Public: list active services, cheapest/soonest-first by sortOrder.
router.get("/", async (_req, res) => {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  });
  res.json(services);
});

// Admin: list all services including inactive ones.
router.get("/all", requireAdmin, async (_req, res) => {
  const services = await prisma.service.findMany({ orderBy: { sortOrder: "asc" } });
  res.json(services);
});

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string().default(""),
  priceCents: z.number().int().nonnegative(),
  durationMin: z.number().int().positive(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

router.post("/", requireAdmin, async (req, res) => {
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const service = await prisma.service.create({ data: parsed.data });
  res.status(201).json(service);
});

router.put("/:id", requireAdmin, async (req, res) => {
  const parsed = serviceSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const service = await prisma.service.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(service);
});

router.delete("/:id", requireAdmin, async (req, res) => {
  await prisma.service.update({ where: { id: req.params.id }, data: { active: false } });
  res.json({ ok: true });
});

export default router;
