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

const VALID_THEMES = ["cream", "obsidian"];

app.get("/api/config", (_req, res) => {
  const theme = process.env.THEME || "cream";
  res.json({
    businessName: process.env.BUSINESS_NAME || "Gaby's Hair Studio",
    adminName: process.env.ADMIN_NAME || "Gaby",
    theme: VALID_THEMES.includes(theme) ? theme : "cream",
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
