import { useEffect, useMemo, useState } from "react";
import { api, Slot, formatDuration } from "../../api";

function groupByDay(slots: Slot[]) {
  const groups = new Map<string, Slot[]>();
  for (const slot of slots) {
    const key = new Date(slot.startsAt).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(slot);
  }
  return Array.from(groups.entries()).map(([key, slots]) => ({
    label: new Date(key).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
    slots: slots.sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
  }));
}

function toLocalInputValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminSchedule() {
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return toLocalInputValue(d);
  });
  const [duration, setDuration] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  function load() {
    api.allSlots().then(setSlots).catch(() => setSlots([]));
  }

  useEffect(load, []);

  const dayGroups = useMemo(() => (slots ? groupByDay(slots) : []), [slots]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createSlot({ startsAt: new Date(date).toISOString(), durationMin: duration });
      load();
    } catch (err: any) {
      setError(err.message || "Couldn't add that slot.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    setError(null);
    try {
      await api.deleteSlot(id);
      setSlots((prev) => (prev ? prev.filter((s) => s.id !== id) : prev));
    } catch (err: any) {
      setError(err.message || "Couldn't remove that slot.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div>
      <div className="admin-header">
        <div>
          <h2>Schedule</h2>
          <p className="muted">Open up new appointment times, or remove ones you haven't filled.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <span className="step-label">Open a new time</span>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleAdd} className="inline-form">
          <div className="form-field" style={{ marginBottom: 0 }}>
            <label htmlFor="date">Date & time</label>
            <input id="date" type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div className="form-field" style={{ marginBottom: 0, maxWidth: 140 }}>
            <label htmlFor="duration">Duration (min)</label>
            <input
              id="duration"
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Adding…" : "Add slot"}
          </button>
        </form>
      </div>

      {slots === null && <div className="spinner-block">Loading…</div>}
      {slots && slots.length === 0 && <div className="empty-state">No upcoming slots yet — add one above.</div>}

      {dayGroups.map((group) => (
        <div className="day-group" key={group.label}>
          <h4>{group.label}</h4>
          {group.slots.map((slot) => (
            <div className="list-item" key={slot.id}>
              <div className="list-item-top">
                <div>
                  <strong>
                    {new Date(slot.startsAt).toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" })}
                  </strong>
                  <div className="muted">{formatDuration(slot.durationMin)}</div>
                </div>
                <span className={`badge ${slot.status === "OPEN" ? "badge-confirmed" : "badge-pending"}`}>
                  {slot.status === "OPEN" ? "open" : "booked"}
                </span>
              </div>
              {slot.booking && (
                <p className="muted">
                  {slot.booking.clientName} — {slot.booking.service.name}
                </p>
              )}
              {slot.status === "OPEN" && (
                <div className="list-item-actions">
                  <button
                    className="btn btn-danger btn-sm"
                    disabled={removingId === slot.id}
                    onClick={() => handleRemove(slot.id)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
