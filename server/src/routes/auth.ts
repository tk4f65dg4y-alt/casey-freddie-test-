import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { signAdminToken, setAdminCookie, clearAdminCookie, requireAdmin, AuthedRequest } from "../auth";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid email or password" });
  }
  const { email, password } = parsed.data;
  const admin = await prisma.admin.findUnique({ where: { email: email.toLowerCase() } });
  if (!admin) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Invalid email or password" });
  }
  const token = signAdminToken({ adminId: admin.id, email: admin.email });
  setAdminCookie(res, token);
  res.json({ id: admin.id, email: admin.email, name: admin.name });
});

router.post("/logout", (_req, res) => {
  clearAdminCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAdmin, async (req: AuthedRequest, res) => {
  const admin = await prisma.admin.findUnique({ where: { id: req.admin!.adminId } });
  if (!admin) return res.status(401).json({ error: "Not authenticated" });
  res.json({ id: admin.id, email: admin.email, name: admin.name });
});

export default router;
