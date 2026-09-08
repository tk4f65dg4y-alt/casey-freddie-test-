import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import authRoutes from "./routes/auth";
import serviceRoutes from "./routes/services";
import slotRoutes from "./routes/slots";
import bookingRoutes from "./routes/bookings";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const VALID_THEMES = ["cream", "obsidian", "emerald", "blush", "navy", "terracotta", "violet", "sky"];

// The site's copy (not just its services/prices/colour) is configurable
// per deployment too, the same way — an env var override with a default
// that reproduces Gaby's original hardcoded content exactly, so existing
// deployments that don't set these are unaffected.
const DEFAULT_TESTIMONIALS = [
  { quote: "Booked in thirty seconds and the colour was exactly what I asked for. Can't go back to phone bookings now.", name: "Freya M." },
  { quote: "Calm, unrushed, and genuinely lovely results. It feels like a proper treat every time.", name: "Priya S." },
  { quote: "Loved seeing the price before I booked — no awkward surprises at the till.", name: "Aisha K." },
];

const DEFAULT_TRUST_STATS = [
  { value: "8+", label: "Years experience" },
  { value: "500+", label: "Happy clients" },
  { value: "5.0★", label: "Average rating" },
  { value: "100%", label: "Booked online" },
];

function parseJsonEnv<T>(name: string, fallback: T): T {
  const raw = process.env[name];
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`${name} is set but isn't valid JSON — falling back to the default.`, err);
    return fallback;
  }
}

app.get("/api/config", (_req, res) => {
  const theme = process.env.THEME || "cream";
  const businessName = process.env.BUSINESS_NAME || "Gaby's Hair Studio";
  const adminName = process.env.ADMIN_NAME || "Gaby";
  res.json({
    businessName,
    adminName,
    theme: VALID_THEMES.includes(theme) ? theme : "cream",
    heroTagline: process.env.HERO_TAGLINE || "Beautiful hair, booked in minutes.",
    heroLede:
      process.env.HERO_LEDE ||
      `${businessName} is a quiet, cream-toned studio for cuts, colour, and styling. See what's on offer, pick a time that suits you, and we'll take it from there.`,
    aboutBio:
      process.env.ABOUT_BIO ||
      `I opened ${businessName} to slow things down — one client at a time, in a calm space, with time taken to actually listen to what you want. Every appointment below is a real open slot in my diary, so book whenever suits.`,
    hoursLine1: process.env.HOURS_LINE1 || "Open Tuesday – Saturday",
    hoursLine2: process.env.HOURS_LINE2 || "By appointment only",
    testimonials: parseJsonEnv("TESTIMONIALS", DEFAULT_TESTIMONIALS),
    trustStats: parseJsonEnv("TRUST_STATS", DEFAULT_TRUST_STATS),
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/bookings", bookingRoutes);

// In production, serve the built web app.
const webDist = path.join(__dirname, "..", "..", "web", "dist");
app.use(express.static(webDist));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(webDist, "index.html"));
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

app.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});
