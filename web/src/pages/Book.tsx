import { useEffect, useMemo, useState } from "react";
import Nav from "../components/Nav";
import Footer from "../components/Footer";
import { api, Service, Slot, formatPrice, formatDuration } from "../api";

function groupSlotsByDay(slots: Slot[]): { label: string; slots: Slot[] }[] {
  const groups = new Map<string, Slot[]>();
  for (const slot of slots) {
    const d = new Date(slot.startsAt);
    const key = d.toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(slot);
  }
  return Array.from(groups.entries()).map(([key, slots]) => ({
    label: new Date(key).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    slots,
  }));
}

export default function Book() {
  const [services, setServices] = useState<Service[] | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [slotId, setSlotId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.services().then(setServices).catch(() => setServices([]));
    api.openSlots().then(setSlots).catch(() => setSlots([]));
  }, []);

  const selectedService = useMemo(
    () => services?.find((s) => s.id === serviceId) ?? null,
    [services, serviceId]
  );
  const selectedSlot = useMemo(() => slots?.find((s) => s.id === slotId) ?? null, [slots, slotId]);
  const dayGroups = useMemo(() => (slots ? groupSlotsByDay(slots) : []), [slots]);

  const canSubmit = serviceId && slotId && name.trim() && phone.trim() && email.trim() && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !slotId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.createBooking({
        serviceId,
        slotId,
        clientName: name.trim(),
        clientPhone: phone.trim(),
        clientEmail: email.trim(),
        note: note.trim() || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong — please try again.");
      // Refresh slots in case this one was just taken.
      api.openSlots().then(setSlots).catch(() => {});
      setSlotId(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (success && selectedService && selectedSlot) {
    return (
      <>
        <Nav />
        <section className="section">
          <div className="container" style={{ maxWidth: 520 }}>
            <div className="card" style={{ textAlign: "center" }}>
              <span className="hero-eyebrow">Request sent</span>
              <h2 style={{ marginTop: 10 }}>Thanks, {name.split(" ")[0]}!</h2>
              <p style={{ marginTop: 14 }}>
                Your request for <strong>{selectedService.name}</strong> on{" "}
                <strong>{new Date(selectedSlot.startsAt).toLocaleString("en-GB", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "numeric",
                  minute: "2-digit",
                })}</strong>{" "}
                has been sent. We'll confirm it shortly by phone or email.
              </p>
            </div>
          </div>
        </section>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <section className="section">
        <div className="container">
          <div className="section-head" style={{ marginBottom: 40 }}>
            <span className="hero-eyebrow">Book an appointment</span>
            <h2>Pick a service & time</h2>
          </div>

          <div className="book-layout">
            <div>
              <div className="card" style={{ marginBottom: 24 }}>
                <span className="step-label">1. Choose a service</span>
                {services === null && <p className="muted">Loading services…</p>}
                {services && services.length === 0 && <p className="muted">No services available.</p>}
                <div className="pill-group">
                  {services?.map((s) => (
                    <div
                      key={s.id}
                      className={`pill-option ${serviceId === s.id ? "selected" : ""}`}
                      onClick={() => setServiceId(s.id)}
                    >
                      <div>
                        <strong>{s.name}</strong>
                        <span className="sub">{formatDuration(s.durationMin)}</span>
                      </div>
                      <span className="service-price" style={{ fontSize: "1.2rem" }}>
                        {formatPrice(s.priceCents)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <span className="step-label">2. Choose a time</span>
                {slots === null && <p className="muted">Loading available times…</p>}
                {slots && slots.length === 0 && (
                  <p className="muted">No open times right now — please check back soon.</p>
                )}
                {dayGroups.map((group) => (
                  <div className="day-group" key={group.label}>
                    <h4>{group.label}</h4>
                    <div className="slot-grid">
                      {group.slots.map((slot) => (
                        <button
                          type="button"
                          key={slot.id}
                          className={`slot-btn ${slotId === slot.id ? "selected" : ""}`}
                          onClick={() => setSlotId(slot.id)}
                        >
                          {new Date(slot.startsAt).toLocaleTimeString("en-GB", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{ position: "sticky", top: 100 }}>
              <span className="step-label">3. Your details</span>

              {selectedService && (
                <div style={{ marginBottom: 18 }}>
                  <div className="summary-row">
                    <span>Service</span>
                    <strong>{selectedService.name}</strong>
                  </div>
                  <div className="summary-row">
                    <span>Price</span>
                    <strong>{formatPrice(selectedService.priceCents)}</strong>
                  </div>
                  {selectedSlot && (
                    <div className="summary-row">
                      <span>Time</span>
                      <strong>
                        {new Date(selectedSlot.startsAt).toLocaleString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </strong>
                    </div>
                  )}
                </div>
              )}

              {error && <div className="alert alert-error">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="form-field">
                  <label htmlFor="name">Full name</label>
                  <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-field">
                  <label htmlFor="phone">Phone</label>
                  <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
                <div className="form-field">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="note">Anything we should know? (optional)</label>
                  <textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={!canSubmit}>
                  {submitting ? "Sending…" : "Request booking"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
