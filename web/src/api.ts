const BASE = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    const message = body?.error;
    throw new Error(typeof message === "string" ? message : "Something went wrong");
  }
  return body as T;
}

export interface Config {
  businessName: string;
  adminName: string;
  theme: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  durationMin: number;
  active: boolean;
  sortOrder: number;
}

export interface Slot {
  id: string;
  startsAt: string;
  durationMin: number;
  status: "OPEN" | "BOOKED";
  booking?: Booking | null;
}

export interface Booking {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  note?: string | null;
  status: "PENDING" | "CONFIRMED" | "DECLINED";
  slotId: string;
  slot: Slot;
  serviceId: string;
  service: Service;
  createdAt: string;
}

export interface Admin {
  id: string;
  email: string;
  name: string;
}

export const api = {
  config: () => request<Config>("/config"),

  services: () => request<Service[]>("/services"),
  allServices: () => request<Service[]>("/services/all"),
  createService: (data: Partial<Service>) =>
    request<Service>("/services", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id: string, data: Partial<Service>) =>
    request<Service>(`/services/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteService: (id: string) => request<{ ok: true }>(`/services/${id}`, { method: "DELETE" }),

  openSlots: () => request<Slot[]>("/slots"),
  allSlots: () => request<Slot[]>("/slots/all"),
  createSlot: (data: { startsAt: string; durationMin: number }) =>
    request<Slot>("/slots", { method: "POST", body: JSON.stringify(data) }),
  createSlotBatch: (data: { dates: string[]; durationMin: number }) =>
    request<Slot[]>("/slots/batch", { method: "POST", body: JSON.stringify(data) }),
  deleteSlot: (id: string) => request<{ ok: true }>(`/slots/${id}`, { method: "DELETE" }),

  createBooking: (data: {
    slotId: string;
    serviceId: string;
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    note?: string;
  }) => request<Booking>("/bookings", { method: "POST", body: JSON.stringify(data) }),
  bookings: () => request<Booking[]>("/bookings"),
  setBookingStatus: (id: string, status: "CONFIRMED" | "DECLINED") =>
    request<Booking>(`/bookings/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),

  login: (email: string, password: string) =>
    request<Admin>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
  me: () => request<Admin>("/auth/me"),
};

export function formatPrice(cents: number): string {
  return `£${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}
