import React, { createContext, useContext, useEffect, useState } from "react";
import { api, Config, Admin } from "./api";

const DEFAULT_CONFIG: Config = {
  businessName: "Gaby's Hair Studio",
  adminName: "Gaby",
  theme: "cream",
  heroTagline: "Beautiful hair, booked in minutes.",
  heroLede:
    "Gaby's Hair Studio is a quiet, cream-toned studio for cuts, colour, and styling. See what's on offer, pick a time that suits you, and we'll take it from there.",
  aboutBio:
    "I opened Gaby's Hair Studio to slow things down — one client at a time, in a calm space, with time taken to actually listen to what you want. Every appointment below is a real open slot in my diary, so book whenever suits.",
  hoursLine1: "Open Tuesday – Saturday",
  hoursLine2: "By appointment only",
  testimonials: [
    { quote: "Booked in thirty seconds and the colour was exactly what I asked for. Can't go back to phone bookings now.", name: "Freya M." },
    { quote: "Calm, unrushed, and genuinely lovely results. It feels like a proper treat every time.", name: "Priya S." },
    { quote: "Loved seeing the price before I booked — no awkward surprises at the till.", name: "Aisha K." },
  ],
  trustStats: [
    { value: "8+", label: "Years experience" },
    { value: "500+", label: "Happy clients" },
    { value: "5.0★", label: "Average rating" },
    { value: "100%", label: "Booked online" },
  ],
};

const FAVICONS: Record<string, string> = {
  cream: "💇",
  obsidian: "🏋️",
  emerald: "🌿",
  blush: "🌸",
  navy: "💼",
  terracotta: "🏺",
  violet: "🔮",
  sky: "🌤️",
};

const ConfigContext = createContext<Config>(DEFAULT_CONFIG);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);

  useEffect(() => {
    api
      .config()
      .then(setConfig)
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", config.theme);
    document.title = config.businessName;
    const emoji = FAVICONS[config.theme] || FAVICONS.cream;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>${emoji}</text></svg>`;
  }, [config]);

  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  return useContext(ConfigContext);
}

interface AuthState {
  admin: Admin | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({ admin: null, loading: true, refresh: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const me = await api.me();
      setAdmin(me);
    } catch {
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return <AuthContext.Provider value={{ admin, loading, refresh }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
